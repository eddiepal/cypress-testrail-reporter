require('path');
const axios = require('axios');
const fs = require('fs');
const TestRailLogger = require('./testrail.logger');
const TestRailCache = require('./testrail.cache');
const chalk = require('chalk');
const FormData = require('form-data');
require('deasync');
import { TestRailOptions, TestRailResult } from './testrail.interface';

export class TestRail {
  private base: string;
  private urlToPage: string;
  private runId: Number | undefined;
  private includeAll: Boolean = true;
  private caseIds: Number[] = [];
  // private retries: Number;

  constructor(private options: TestRailOptions) {
    this.base = `${options.host}/index.php?/api/v2`;
    this.urlToPage = options.host + '/index.php?';
  }

  public getSuite = async (suiteId: number) => {
    console.log(chalk.blue('\nRetrieving test suite from TestRail...'));
    const url = this.base + '/get_suite/' + suiteId;
    await axios({
      method: 'get',
      url: url,
      headers: {'Content-Type': 'application/json'},
      auth: {
        username: this.options.username,
        password: this.options.password,
      },
    })
      .then((response: any) => {
        console.log(chalk.green('Test suite retrieved.'));
        return response.data;
      })
      .catch((error: any) => {
        console.log(chalk.red('Failed to retrieve test suite. Response message - ' + error));
        return error;
      });
  };
  public getCases = async (suiteId: number, groupId: number | undefined) => {
    let url = this.base + '/get_cases/' + this.options.projectId + '&suite_id=' + suiteId;
    const initialUrl = this.urlToPage;
    let caseIdArray: number[] = [];
    let nextPage: String = '';
    let newUrl: String = '';

    if (groupId) {
      url += '&section_id=' + groupId;
    }
    if (this.options.filter) {
      url += '&filter=' + this.options.filter;
    }
    if (this.options.typeId) {
      url += '&type_id=' + this.options.typeId;
    }

    newUrl = url + '&limit=250&offset=0';

    console.log(chalk.blue('Retrieving relative test cases from TestRail...'));
    while (nextPage !== null) {
      await axios({
        method: 'get',
        url: newUrl,
        headers: {'Content-Type': 'application/json'},
        auth: {
          username: this.options.username,
          password: this.options.password,
        },
      }).then((response: any) => {
        nextPage = response.data._links.next;
        caseIdArray = caseIdArray.concat(response.data.cases.map((item: any) => {
          return item.id;
        }));
        newUrl = initialUrl + nextPage;
        if (nextPage === null) {
            console.log(chalk.green('Test cases retrieved.\n'));
        }
      })
          .catch((error: any) => {
            console.log(chalk.red('\nFailed to retrieve test cases. Response message - ' + error));
            return console.error(error);
          });
    }
    return caseIdArray;
  };
  public createRun = async (name: string, host: string, description: string, suiteId: number) => {
    const _host = host;

    if (this.options.includeAllInTestRun === false) {
      this.includeAll = false;
      if (this.options.groupIds) {
        for (let i = 0; i < this.options.groupIds.length; i++) {
          const subCaseIds = await this.getCases(suiteId, parseInt(this.options.groupIds[i]));
          this.caseIds = Array.prototype.concat(this.caseIds, subCaseIds);
        }
      } else {
        this.caseIds = await this.getCases(suiteId, undefined);
      }
    }

    axios({
      method: 'post',
      url: this.base + '/add_run/' + this.options.projectId,
      headers: {'Content-Type': 'application/json'},
      auth: {
        username: this.options.username,
        password: this.options.password,
      },
      data: JSON.stringify({
        suite_id: suiteId,
        name: name,
        description: description,
        include_all: this.includeAll,
        case_ids: this.caseIds,
      }),
    })
        .then((response: any) => {
          this.runId = response.data.id;
          // cache the TestRail Run ID
          TestRailCache.store('runId', this.runId);
          const path = 'runs/view/' + this.runId;
          TestRailLogger.log('Results are published to ' + chalk.magenta(_host + '/index.php?/' + path));
        })
        .catch((error: any) => {
          return console.error(error);
        });
  };
  public deleteRun = () => {
    this.runId = TestRailCache.retrieve('runId');
    axios({
      method: 'post',
      url: this.base + '/delete_run/' + this.runId,
      headers: {'Content-Type': 'application/json'},
      auth: {
        username: this.options.username,
        password: this.options.password,
      },
    }).catch((error: any) => {
      return console.error(error);
    });
  };
  public publishResults = (results: TestRailResult[]) => {
    this.runId = TestRailCache.retrieve('runId');
    console.log(chalk.blue('Adding results from current spec file to TestRail...'));

    return axios({
      method: 'post',
      url: this.base + '/add_results_for_cases/' + this.runId,
      headers: {'Content-Type': 'application/json'},
      auth: {
        username: this.options.username,
        password: this.options.password,
      },
      data: JSON.stringify({results: results}),
    })
        .then((response: any) => {
          console.log(chalk.green('Results added to test run.'));
          return response.data;
        })
        .catch((error: any) => {
          console.log(chalk.red('Failed to add results to TestRail. Response message - ' + error));
        });
  };
  public uploadAttachment (resultId: number, path: string) {
    const form = new FormData();
    form.append('attachment', fs.createReadStream(path));

    axios({
        method: 'post',
        url: `${this.base}/add_attachment_to_result/${resultId}`,
        headers: { ...form.getHeaders() },
        auth: {
          username: this.options.username,
          password: this.options.password,
        },
        data: form,
    })
  }
  // This function will attach failed screenshot on each test result(comment) if founds it
  // public uploadScreenshots = (caseId: string, resultId: number, _path: string) => {
  //   const SCREENSHOTS_FOLDER_PATH = _path.replace('integration', 'screenshots');

  //   fs.readdir(SCREENSHOTS_FOLDER_PATH, (err: any, files: any) => {
  //     if (err) {
  //       return console.log('Unable to scan screenshots folder: ' + err);
  //     }
  //     files.forEach((file: any) => {
  //       if (file.includes('C' + caseId) && /(failed|attempt)/g.test(file)) {
  //         try {
  //           this.uploadAttachment(resultId, SCREENSHOTS_FOLDER_PATH +'/'+ file);
  //         } catch (err) {
  //           console.log('Screenshot upload error: ', err);
  //         }
  //       }
  //     });
  //   });
  // };
  // public uploadDownloads = (caseId: number, resultId: number, _path: string) => {
  //   const DOWNLOADS_FOLDER_PATH = _path.split('cypress')[0] + 'cypress/downloads';

  //   fs.readdir(DOWNLOADS_FOLDER_PATH, (err: any, files: any) => {
  //     if (err) {
  //       return console.log('Unable to scan downloads folder: ' + err);
  //     }
  //     files.forEach((file: any) => {
  //       try {
  //         this.uploadAttachment(resultId, DOWNLOADS_FOLDER_PATH +'/'+ file);
  //       } catch (err) {
  //         console.log('Download upload error: ', err);
  //       }
  //     });
  //   });
  // };
  // public uploadVideos = (caseId: number, resultId: number, _path: string) => {
  //   const vPath = _path.replace('integration','videos');
  //   const VIDEOS_FOLDER_PATH = vPath.replace(/([^/]*js)$/g, '');
  //   const vidName = vPath.slice(vPath.lastIndexOf('/')).replace('/','');

  //   const {fork} = require('child_process');
  //   const child = fork(__dirname + '/publishVideo.js', {
  //     detached: true,
  //     stdio: 'inherit',
  //     env: Object.assign(process.env, {
  //       vName: vidName,
  //       vFolder: VIDEOS_FOLDER_PATH,
  //       resId: resultId,
  //       base: this.base,
  //       username: this.options.username,
  //       pwd: this.options.password,
  //     }),
  //   }).unref();
  // };
  // public closeRun = () => {
  //   this.runId = TestRailCache.retrieve('runId');
  //   axios({
  //     method: 'post',
  //     url: this.base + '/close_run/' + this.runId,
  //     headers: {'Content-Type': 'application/json'},
  //     auth: {
  //       username: this.options.username,
  //       password: this.options.password,
  //     },
  //   })
  //       .then(() => {
  //         TestRailLogger.log('Test run closed successfully');
  //       })
  //       .catch((error: any) => {
  //         return console.error(error);
  //       });
  // };
}
