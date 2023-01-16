'use strict';
const __extends = (this && this.__extends) || (function() {
  let extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
            ({__proto__: []} instanceof Array && function(d, b) {
              d.__proto__ = b;
            }) ||
            function(d, b) {
              for (const p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
            };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== 'function' && b !== null) {
      throw new TypeError('Class extends value ' + String(b) +
      ' is not a constructor or null');
    }

    extendStatics(d, b);
    // eslint-disable-next-line require-jsdoc
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
})();
Object.defineProperty(exports, '__esModule', {value: true});
exports.CypressTestRailReporter = void 0;
const mocha1 = require('mocha');
const moment = require('moment');
const testRail1 = require('./testrail');
const shared1 = require('./shared');
const testRailInterface1 = require('./testrail.interface');
const testRailValidation1 = require('./testrail.validation');
const TestRailCache = require('./testrail.cache');
const TestRailLogger = require('./testrail.logger');
const runCounter = 1;
const CypressTestRailReporter = /** @class */ (function(_super) {
  __extends(CypressTestRailReporter, _super);
  /**
 * @param {int} runner The Cypress runner??.
 * @param {int} options Reporter options.
 * @return {any}
 */
  function CypressTestRailReporter(runner, options) {
    const _this = _super.call(this, runner) || this;
    _this.results = [];
    _this.suiteId = [];
    _this.reporterOptions = options.reporterOptions;

    if (process.env.CYPRESS_TESTRAIL_REPORTER_USERNAME) {
      _this.reporterOptions.username = process.env.CYPRESS_TESTRAIL_REPORTER_USERNAME;
    }
    if (process.env.CYPRESS_TESTRAIL_REPORTER_PASSWORD) {
      _this.reporterOptions.password = process.env.CYPRESS_TESTRAIL_REPORTER_PASSWORD;
    }
    if (process.env.CYPRESS_TESTRAIL_REPORTER_RUNNAME) {
      _this.reporterOptions.runName = process.env.CYPRESS_TESTRAIL_REPORTER_RUNNAME;
    }
    if (process.env.CYPRESS_TESTRAIL_REPORTER_GROUPID) {
      _this.reporterOptions.groupId = process.env.CYPRESS_TESTRAIL_REPORTER_GROUPID;
    }
    if (process.env.CYPRESS_TESTRAIL_RUN_ID) {
      TestRailCache.store('runId', process.env.CYPRESS_TESTRAIL_RUN_ID);
    }

    _this.testRailApi = new testRail1.TestRail(_this.reporterOptions);
    _this.testRailValidation = new testRailValidation1.TestRailValidation(_this.reporterOptions);

    /**
         * This will validate reporter options defined in cypress.json file
         * if we are passing suiteId as a part of this file than we assign value to variable
         * usually this is the case for single suite projects
         */
    _this.testRailValidation.validateReporterOptions(_this.reporterOptions);
    if (_this.reporterOptions.suiteId) {
      _this.suiteId = _this.reporterOptions.suiteId;
    }
    if (_this.reporterOptions.groupId) {
      _this.groupId = _this.reporterOptions.groupId;
    }
    if (_this.reporterOptions.runId) {
      TestRailCache.store('runId', _this.reporterOptions.runId);
    }
    /**
         * This will validate runtime environment variables
         * if we are passing suiteId as a part of runtime env variables we assign that value to variable
         * usually we use this way for multi suite projects
         */
    const cliArguments = _this.testRailValidation.validateCLIArguments();
    if (cliArguments && cliArguments.length) {
      _this.suiteId = cliArguments;
    }
    /**
         * If no suiteId has been passed with previous two methods
         * runner will not be triggered
         */
    if (_this.suiteId && _this.suiteId.toString().length) {
      runner.on('start', function() {
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
          if (_this.reporterOptions.suiteId) {
            TestRailLogger.log('Following suiteId has been set in cypress.json file: ' + _this.suiteId);
          }
          const executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
          const name1 = (_this.reporterOptions.runName || 'Automated test run') + ' ' + executionDateTime;
          let description = '';

          if (_this.reporterOptions.disableDescription) {
            description = '';
          } else if (process.env.CYPRESS_CI_JOB_URL) {
            description = process.env.CYPRESS_CI_JOB_URL;
          } else {
            description = 'For the Cypress run visit https://dashboard.cypress.io/#/projects/runs';
          }

          TestRailLogger.log('Creating TestRail Run with name: ' + name1);
          _this.testRailApi.createRun(name1, _this.reporterOptions.host, description, _this.suiteId);
        } else {
          // use the cached TestRail Run ID
          _this.runId = TestRailCache.retrieve('runId');
          TestRailLogger.log('Using existing TestRail Run with ID: \'' + _this.runId + '\'');
        }
      });
      runner.on('pass', function(test) {
        _this.submitResults(testRailInterface1.Status.Passed, test, 'Execution time: ' + test.duration + 'ms');
      });
      runner.on('fail', function(test, err) {
        _this.submitResults(testRailInterface1.Status.Failed, test, '' + err.message);
      });
      runner.on('retry', function(test) {
        _this.submitResults(testRailInterface1.Status.Retest, test, 'Cypress retry logic has been triggered!');
      });
    }
    return _this;
  }

  /**
   * Ensure that after each test results are reported continuously
   * Additionally to that if test status is failed or retried there is possibility
   * to upload failed screenshot for easier debugging in TestRail
   * Note: Uploading of screenshot is configurable option
   * @param {string} status The test status.
   * @param {object} test The test object.
   * @param {string} comment The test comment.
   * @return {CypressTestRailReporter}
 */
  CypressTestRailReporter.prototype.submitResults = async function(status, test, comment) {
    let _a;
    const _this = this;
    let filePath;
    if (test.invocationDetails !== undefined) {
      filePath = test.invocationDetails.absoluteFile;
      TestRailCache.store('screenshotPath', filePath);
    } else {
      filePath = TestRailCache.retrieve('screenshotPath');
    }

    let caseIds = shared1.titleToCaseIds(test.title);
    const listGroupIds = this.reporterOptions.groupId;
    let serverCaseIds = [];

    if (this.reporterOptions.includeAllInTestRun === false) {
      if (listGroupIds) {
        const groupIDS = listGroupIds.toString().split(',');
        for (let i = 0; i < groupIDS.length; i) {
          const subcaseids = await _this.testRailApi.getCases(this.reporterOptions.suiteId, groupIDS[i]);
          serverCaseIds = Array.prototype.concat(serverCaseIds, subcaseids);
        }
      } else {
        // TODO? - filter by name?
      }
    } else {
      serverCaseIds = await _this.testRailApi.getCases(this.reporterOptions.suiteId, null);
    }

    const invalidCaseIds = caseIds.filter(function(caseId) {
      return !Array.from(serverCaseIds).includes(caseId);
    });
    caseIds = caseIds.filter(function(caseId) {
      return Array.from(serverCaseIds).includes(caseId);
    });

    if (invalidCaseIds.length > 0) {
      TestRailLogger.log(
          'The following test IDs were found in Cypress tests, but not found in TestRail: ' + invalidCaseIds);
    }
    if (caseIds.length) {
      const caseResults = caseIds.map(function(caseId) {
        return {
          case_id: caseId,
          status_id: status,
          comment: comment,
        };
      });
      (_a = this.results).push.apply(_a, caseResults);
      const publishedResults = await this.testRailApi.publishResults(caseResults);
      if (publishedResults !== undefined &&
                this.reporterOptions.allowOnFailureScreenshotUpload === true &&
                (status === testRailInterface1.Status.Failed)) {
        Array.prototype.forEach.call(publishedResults, (function(result) {
          _this.testRailApi.uploadScreenshots(caseIds[0], result.id, filePath);
        }));
      }
      if (publishedResults !== undefined &&
                this.reporterOptions.allowOnFailureVideoUpload === true &&
                (status === testRailInterface1.Status.Failed)) {
        Array.prototype.forEach.call(publishedResults, (function(result) {
          _this.testRailApi.uploadVideos(caseIds[0], result.id, filePath);
        }));
      }
      if (publishedResults !== undefined &&
                this.reporterOptions.allowExportDownloads === true ) {
        Array.prototype.forEach.call(publishedResults, (function(result) {
          _this.testRailApi.uploadDownloads(caseIds[0], result.id, filePath);
        }));
      }
    }
  };
  return CypressTestRailReporter;
}(mocha1.reporters.Spec));
exports.CypressTestRailReporter = CypressTestRailReporter;
// # sourceMappingURL=cypress-testrail-reporter.js.map
