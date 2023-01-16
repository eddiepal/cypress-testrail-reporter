'use strict';
let __assign = (this && this.__assign) || function() {
  __assign = Object.assign || function(t) {
    for (let s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (const p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) {
          t[p] = s[p];
        }
      }
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
Object.defineProperty(exports, '__esModule', {value: true});
exports.TestRail = void 0;
require('path');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const TestRailLogger = require('./testrail.logger');
const TestRailCache = require('./testrail.cache');
const chalk = require('chalk');
const TestRail = /** @class */ (function() {
  /**
   * @param {string} options Reporter options.
 */
  function TestRail(options) {
    this.options = options;
    this.includeAll = true;
    this.caseIds = [];
    this.base = options.host + '/index.php?/api/v2';
    this.urlToPage = options.host + '/index.php?';
    this.runId;
  }
  TestRail.prototype.getCases = async function(suiteId, groupId) {
    let url = this.base + '/get_cases/' + this.options.projectId + '&suite_id=' + suiteId;
    const initialUrl = this.urlToPage;
    let caseIdArray = [];
    let nextPage = '';
    let newUrl = '';

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

    while (nextPage != null) {
      await axios({
        method: 'get',
        url: newUrl,
        headers: {'Content-Type': 'application/json'},
        auth: {
          username: this.options.username,
          password: this.options.password,
        },
      }).then( function(response) {
        nextPage = response.data._links.next;
        caseIdArray = caseIdArray.concat(response.data.cases.map(function(item) {
          return item.id;
        }));
        newUrl = initialUrl + nextPage;
      })
          .catch(function(error) {
            return console.error(error);
          });
    }
    return caseIdArray;
  };
  TestRail.prototype.createRun = async function(name, host, description, suiteId) {
    const _this = this;
    const _host = host;
    const listGroupIds = this.options.groupId;

    if (this.options.includeAllInTestRun === false) {
      this.includeAll = false;
      if (listGroupIds) {
        const groupIDS = listGroupIds.toString().split(',');
        for (let i = 0; i < groupIDS.length; i++) {
          const subCaseIds = await this.getCases(suiteId, groupIDS[i]);
          this.caseIds = Array.prototype.concat(this.caseIds, subCaseIds);
        }
      } else {
        this.caseIds = await this.getCases(suiteId, null);
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
        .then(function(response) {
          _this.runId = response.data.id;
          // cache the TestRail Run ID
          TestRailCache.store('runId', _this.runId);
          const path = 'runs/view/' + _this.runId;
          TestRailLogger.log('Results are published to ' + chalk.magenta(_host + '/index.php?/' + path));
        })
        .catch(function(error) {
          return console.error(error);
        });
  };
  TestRail.prototype.deleteRun = function() {
    this.runId = TestRailCache.retrieve('runId');
    axios({
      method: 'post',
      url: this.base + '/delete_run/' + this.runId,
      headers: {'Content-Type': 'application/json'},
      auth: {
        username: this.options.username,
        password: this.options.password,
      },
    }).catch(function(error) {
      return console.error(error);
    });
  };
  TestRail.prototype.publishResults = function(results) {
    this.runId = TestRailCache.retrieve('runId');
    const _res = results;
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
        .then(function(response) {
          return response.data;
        })
        .catch(function(error) {
          TestRailLogger.log('Test case '+_res[0].case_id+ ' was not found in the test run');
        });
  };

  TestRail.prototype.uploadAttachment = function(resultId, path) {
    const form = new FormData();
    form.append('attachment', fs.createReadStream(path));
    return axios({
      method: 'post',
      url: this.base + '/add_attachment_to_result/' + resultId,
      headers: __assign({}, form.getHeaders()),
      auth: {
        username: this.options.username,
        password: this.options.password,
      },
      data: form,
    });
  };
  // This function will attach failed screenshot on each test result(comment) if founds it
  TestRail.prototype.uploadScreenshots = function(caseId, resultId, _path) {
    const _this = this;
    const SCREENSHOTS_FOLDER_PATH = _path.replace('integration', 'screenshots');

    fs.readdir(SCREENSHOTS_FOLDER_PATH, function(err, files) {
      if (err) {
        return console.log('Unable to scan screenshots folder: ' + err);
      }
      files.forEach(function(file) {
        if (file.includes('C' + caseId) && /(failed|attempt)/g.test(file)) {
          try {
            _this.uploadAttachment(resultId, SCREENSHOTS_FOLDER_PATH +'/'+ file);
          } catch (err) {
            console.log('Screenshot upload error: ', err);
          }
        }
      });
    });
  };
  TestRail.prototype.uploadDownloads = function(caseId, resultId, _path) {
    const _this = this;
    const DOWNLOADS_FOLDER_PATH = _path.split('cypress')[0] + 'cypress/downloads';

    fs.readdir(DOWNLOADS_FOLDER_PATH, function(err, files) {
      if (err) {
        return console.log('Unable to scan downloads folder: ' + err);
      }
      files.forEach(function(file) {
        try {
          _this.uploadAttachment(resultId, DOWNLOADS_FOLDER_PATH +'/'+ file);
        } catch (err) {
          console.log('Download upload error: ', err);
        }
      });
    });
  };
  TestRail.prototype.uploadVideos = function(caseId, resultId, _path) {
    const _this = this;
    const vPath = _path.replace('integration','videos');
    const VIDEOS_FOLDER_PATH = vPath.replace(/([^\/]*js)$/g, '');
    const vidName = vPath.slice(vPath.lastIndexOf('/')).replace('/','');

    const {fork} = require('child_process');
    const child = fork(__dirname + '/publishVideo.js', {
      detached: true,
      stdio: 'inherit',
      env: Object.assign(process.env, {
        vName: vidName,
        vFolder: VIDEOS_FOLDER_PATH,
        resId: resultId,
        base: this.base,
        username: this.options.username,
        pwd: this.options.password,
      }),
    }).unref();
  };
  TestRail.prototype.closeRun = function() {
    this.runId = TestRailCache.retrieve('runId');
    axios({
      method: 'post',
      url: this.base + '/close_run/' + this.runId,
      headers: {'Content-Type': 'application/json'},
      auth: {
        username: this.options.username,
        password: this.options.password,
      },
    })
        .then(function() {
          TestRailLogger.log('Test run closed successfully');
        })
        .catch(function(error) {
          return console.error(error);
        });
  };
  return TestRail;
}());
exports.TestRail = TestRail;
