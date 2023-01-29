"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRail = void 0;
require('path');
const axios = require('axios');
const fs = require('fs');
const TestRailLogger = require('./testrail.logger');
const TestRailCache = require('./testrail.cache');
const chalk = require('chalk');
const FormData = require('form-data');
require('deasync');
class TestRail {
    // private retries: Number;
    constructor(options) {
        this.options = options;
        this.includeAll = true;
        this.caseIds = [];
        this.getCases = async (suiteId, groupId) => {
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
            console.log(chalk.blue('Retrieving relative test cases from TestRail...'));
            while (nextPage !== null) {
                await axios({
                    method: 'get',
                    url: newUrl,
                    headers: { 'Content-Type': 'application/json' },
                    auth: {
                        username: this.options.username,
                        password: this.options.password,
                    },
                }).then((response) => {
                    nextPage = response.data._links.next;
                    caseIdArray = caseIdArray.concat(response.data.cases.map((item) => {
                        return item.id;
                    }));
                    newUrl = initialUrl + nextPage;
                    if (nextPage === null) {
                        console.log(chalk.green('Test cases retrieved.\n'));
                    }
                })
                    .catch((error) => {
                    console.log(chalk.red('\nFailed to retrieve test cases. Response message - ' + error));
                    return console.error(error);
                });
            }
            return caseIdArray;
        };
        this.createRun = async (name, host, description, suiteId) => {
            const _host = host;
            const listGroupIds = this.options.groupId;
            if (this.options.includeAllInTestRun === false) {
                this.includeAll = false;
                if (listGroupIds) {
                    const groupIDS = listGroupIds.toString().split(',');
                    for (let i = 0; i < groupIDS.length; i++) {
                        const subCaseIds = await this.getCases(suiteId, parseInt(groupIDS[i]));
                        this.caseIds = Array.prototype.concat(this.caseIds, subCaseIds);
                    }
                }
                else {
                    this.caseIds = await this.getCases(suiteId, undefined);
                }
            }
            axios({
                method: 'post',
                url: this.base + '/add_run/' + this.options.projectId,
                headers: { 'Content-Type': 'application/json' },
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
                .then((response) => {
                this.runId = response.data.id;
                // cache the TestRail Run ID
                TestRailCache.store('runId', this.runId);
                const path = 'runs/view/' + this.runId;
                TestRailLogger.log('Results are published to ' + chalk.magenta(_host + '/index.php?/' + path));
            })
                .catch((error) => {
                return console.error(error);
            });
        };
        this.deleteRun = () => {
            this.runId = TestRailCache.retrieve('runId');
            axios({
                method: 'post',
                url: this.base + '/delete_run/' + this.runId,
                headers: { 'Content-Type': 'application/json' },
                auth: {
                    username: this.options.username,
                    password: this.options.password,
                },
            }).catch((error) => {
                return console.error(error);
            });
        };
        this.publishResults = (results) => {
            this.runId = TestRailCache.retrieve('runId');
            console.log(chalk.blue('Adding results from current spec file to TestRail...'));
            return axios({
                method: 'post',
                url: this.base + '/add_results_for_cases/' + this.runId,
                headers: { 'Content-Type': 'application/json' },
                auth: {
                    username: this.options.username,
                    password: this.options.password,
                },
                data: JSON.stringify({ results: results }),
            })
                .then((response) => {
                console.log(chalk.green('Results added to test run.'));
                return response.data;
            })
                .catch((error) => {
                console.log(chalk.red('Failed to add results to TestRail. Response message - ' + error));
            });
        };
        // This function will attach failed screenshot on each test result(comment) if founds it
        this.uploadScreenshots = (caseId, resultId, _path) => {
            const SCREENSHOTS_FOLDER_PATH = _path.replace('integration', 'screenshots');
            fs.readdir(SCREENSHOTS_FOLDER_PATH, (err, files) => {
                if (err) {
                    return console.log('Unable to scan screenshots folder: ' + err);
                }
                files.forEach((file) => {
                    if (file.includes('C' + caseId) && /(failed|attempt)/g.test(file)) {
                        try {
                            this.uploadAttachment(resultId, SCREENSHOTS_FOLDER_PATH + '/' + file);
                        }
                        catch (err) {
                            console.log('Screenshot upload error: ', err);
                        }
                    }
                });
            });
        };
        this.uploadDownloads = (caseId, resultId, _path) => {
            const DOWNLOADS_FOLDER_PATH = _path.split('cypress')[0] + 'cypress/downloads';
            fs.readdir(DOWNLOADS_FOLDER_PATH, (err, files) => {
                if (err) {
                    return console.log('Unable to scan downloads folder: ' + err);
                }
                files.forEach((file) => {
                    try {
                        this.uploadAttachment(resultId, DOWNLOADS_FOLDER_PATH + '/' + file);
                    }
                    catch (err) {
                        console.log('Download upload error: ', err);
                    }
                });
            });
        };
        this.uploadVideos = (caseId, resultId, _path) => {
            const vPath = _path.replace('integration', 'videos');
            const VIDEOS_FOLDER_PATH = vPath.replace(/([^/]*js)$/g, '');
            const vidName = vPath.slice(vPath.lastIndexOf('/')).replace('/', '');
            const { fork } = require('child_process');
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
        this.closeRun = () => {
            this.runId = TestRailCache.retrieve('runId');
            axios({
                method: 'post',
                url: this.base + '/close_run/' + this.runId,
                headers: { 'Content-Type': 'application/json' },
                auth: {
                    username: this.options.username,
                    password: this.options.password,
                },
            })
                .then(() => {
                TestRailLogger.log('Test run closed successfully');
            })
                .catch((error) => {
                return console.error(error);
            });
        };
        this.base = `${options.host}/index.php?/api/v2`;
        this.urlToPage = options.host + '/index.php?';
    }
    uploadAttachment(resultId, path) {
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
        });
    }
}
exports.TestRail = TestRail;
//# sourceMappingURL=testrail.js.map