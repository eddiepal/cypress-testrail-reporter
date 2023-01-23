import { reporters, Runner } from 'mocha';
import * as moment from 'moment';
import { TestRail } from './testrail';
import { titleToCaseIds } from './shared';
import { Status, TestRailResult } from './testrail.interface';
import { TestRailValidation } from './testrail.validation';
const TestRailCache = require('./testrail.cache');
const TestRailLogger = require('./testrail.logger');
require('deasync');
const chalk = require('chalk');
const runCounter = 1;

export class CypressTestRailReporter extends reporters.Spec {
    private results: TestRailResult[] = [];
    private testRailApi: TestRail;
    private testRailValidation: TestRailValidation;
    private runId: number | undefined;
    private reporterOptions: any;
    private suiteId: any = [];
    private caseIds: number[] = [];
    private caseResults: TestRailResult[] = [];

    constructor(runner: Runner, options: any) {
      super(runner);

      this.reporterOptions = options.reporterOptions;

      const reporterEnvKeys = [
        'CYPRESS_TESTRAIL_REPORTER_USERNAME',
        'CYPRESS_TESTRAIL_REPORTER_PASSWORD',
        'CYPRESS_TESTRAIL_REPORTER_RUNNAME',
        'CYPRESS_TESTRAIL_REPORTER_GROUPID'
      ];

      reporterEnvKeys.forEach((key) => {
        if (process.env[key]) {
            this.reporterOptions[key.replace('CYPRESS_TESTRAIL_REPORTER_', '').toLowerCase()] = process.env[key];
        }
      });

      if (process.env.CYPRESS_TESTRAIL_RUN_ID) {
        TestRailCache.store('runId', process.env.CYPRESS_TESTRAIL_RUN_ID);
      }

      this.testRailApi = new TestRail(this.reporterOptions);
      this.testRailValidation = new TestRailValidation(this.reporterOptions);

      /**
       * This will validate reporter options defined in cypress.json file
       * if we are passing suiteId as a part of this file than we assign value to variable
       * usually this is the case for single suite projects
       */
      this.testRailValidation.validateReporterOptions(this.reporterOptions);

      if (this.reporterOptions.suiteId) {
        this.testRailApi.getSuite(this.reporterOptions.suiteId)
        .then((resBody: any) => {
          console.log(chalk.green(`Suite ID ${resBody.id} will be used for th test run.`));
          this.suiteId = this.reporterOptions.suiteId;
        })
        .catch((error: any) => {
            throw new Error(`Failed to retrieve test suite. Response message - ${error})`);
        });
      }
      if (this.reporterOptions.runId) {
        TestRailCache.store('runId', this.reporterOptions.runId);
      }
      /**
       * This will validate runtime environment variables
       * if we are passing suiteId as a part of runtime env variables we assign that value to variable
       * usually we use this way for multi suite projects
       */
      const cliArguments = this.testRailValidation.validateCLIArguments();
      if (cliArguments && cliArguments.length) {
        this.suiteId = cliArguments;
      }
      /**
       * If no suiteId has been passed with previous two methods
       * runner will not be triggered
       */
      if (this.suiteId && this.suiteId.toString().length) {
        runner.on('start', () => {
          /**
          * runCounter is used to count how many spec files we have during one run
          * in order to wait for close test run function
          */
          TestRailCache.store('runCounter', runCounter);
          /**
          * creates a new TestRail Run
          * unless a cached value already exists for an existing TestRail Run in
          * which case that will be used and no new one created.
          */
          if (!TestRailCache.retrieve('runId')) {
            if (this.reporterOptions.suiteId) {
              TestRailLogger.log('Following suiteId has been set in cypress.json file: ' + this.suiteId);
            }
            const executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
            const name1 = (this.reporterOptions.runName || 'Automated test run') + ' ' + executionDateTime;
            let description = '';

            if (this.reporterOptions.disableDescription) {
              description = '';
            } else if (process.env.CYPRESS_CI_JOB_URL) {
              description = process.env.CYPRESS_CI_JOB_URL;
            } else {
              description = 'For the Cypress run visit https://dashboard.cypress.io/#/projects/runs';
            }

            TestRailLogger.log('Creating TestRail Run with name: ' + name1);
            this.testRailApi.createRun(name1, this.reporterOptions.host, description, this.suiteId);
          } else {
            // use the cached TestRail Run ID
            this.runId = TestRailCache.retrieve('runId');
            TestRailLogger.log('Using existing TestRail Run with ID: \'' + this.runId + '\'');
          }
        });
        runner.on('pass', (test: any) => {
          this.addToResults(Status.Passed, test, 'Execution time: ' + test.duration + 'ms');
        });
        runner.on('fail', (test: any, err: any) => {
          this.addToResults(Status.Failed, test, '' + err.message);
        });
        runner.on('retry', (test: any) => {
          this.addToResults(Status.Retest, test, 'Cypress retry logic has been triggered!');
        });
        runner.on('end', () => {
          this.submitResults();
          this.caseResults = [];
          this.caseIds = [];
        });
      }
  }

  /**
   * @param {int} status The test status.
   * @param {object} test The test object.
   * @param {string} comment The test comment.
 */
  public addToResults = async (status: number, test: any, comment: string) => {
    const caseID = titleToCaseIds(test.title)[0];
    this.caseIds.push(caseID);

    const caseResult = {
      case_id: caseID,
      status_id: status,
      comment: comment,
    };

    this.caseResults.push(caseResult);
  };

  /**
   * Ensure that after each test results are reported continuously
   * Additionally to that if test status is failed or retried there is possibility
   * to upload failed screenshot for easier debugging in TestRail
   * Note: Uploading of screenshot is configurable option
 */
  public submitResults = () => {
    // TODO: refactor to work with request changes
    // let _a;
    // let filePath;
    let serverCaseIds: number[] = [];
    let done = false;

    // if (test.invocationDetails !== undefined) {
    //   filePath = test.invocationDetails.absoluteFile;
    //   TestRailCache.store('screenshotPath', filePath);
    // } else {
    //   filePath = TestRailCache.retrieve('screenshotPath');
    // }

    (async () => {
      if (this.reporterOptions.includeAllInTestRun === false) {
        if (this.reporterOptions.groupIds) {
          for (let i = 0; i < this.reporterOptions.groupIds.length; i++) {
            const subCaseIds = await this.testRailApi.getCases(
              this.reporterOptions.suiteId,
              this.reporterOptions.groupIds[i]
            );
            serverCaseIds = Array.prototype.concat(serverCaseIds, subCaseIds);
          }
        } else {
          // TODO? - filter by name?
        }
      } else {
        serverCaseIds = await this.testRailApi.getCases(this.reporterOptions.suiteId, undefined);
      }

      const invalidCaseIds = this.caseIds.filter((caseId) => {
        return !Array.from(serverCaseIds).includes(caseId);
      });
      const validCaseIDs = this.caseIds.filter((caseId) => {
        return Array.from(serverCaseIds).includes(caseId);
      });

      if (invalidCaseIds.length > 0) {
          console.log(chalk.rgb(255, 165, 0)(
              'WARNING: The following case IDs were found in the current spec file, but not found in TestRail: ' +
              invalidCaseIds + '\n'));
      }
      // TODO: refactor to work with request changes
      // (_a = this.results).push.apply(_a, caseResults);
      // const publishedResults =
      await this.testRailApi.publishResults(this.caseResults.filter(
          (x) => validCaseIDs.includes(x.case_id))).then(() =>
            {
              done = true;
            })
      // if (publishedResults !== undefined &&
      //             this.reporterOptions.allowOnFailureScreenshotUpload === true &&
      //             (status === testRailInterface.Status.Failed)) {
      //   Array.prototype.forEach.call(publishedResults, (function(result) {
      //     _this.testRailApi.uploadScreenshots(caseIds[0], result.id, filePath);
      //   }));
      // }
      // if (publishedResults !== undefined &&
      //             this.reporterOptions.allowOnFailureVideoUpload === true &&
      //             (status === testRailInterface.Status.Failed)) {
      //   Array.prototype.forEach.call(publishedResults, (function(result) {
      //     _this.testRailApi.uploadVideos(caseIds[0], result.id, filePath);
      //   }));
      // }
      // if (publishedResults !== undefined &&
      //             this.reporterOptions.allowExportDownloads === true ) {
      //   Array.prototype.forEach.call(publishedResults, (function(result) {
      //     _this.testRailApi.uploadDownloads(caseIds[0], result.id, filePath);
      //   }));
      // }
    })();
    require('deasync').loopWhile(() => {return !done;});
  };
}
