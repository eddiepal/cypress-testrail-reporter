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
        this.getSuite = async (suiteId) => {
            console.log(chalk.blue('\nRetrieving test suite from TestRail...'));
            const url = this.base + '/get_suite/' + suiteId;
            await axios({
                method: 'get',
                url: url,
                headers: { 'Content-Type': 'application/json' },
                auth: {
                    username: this.options.username,
                    password: this.options.password,
                },
            })
                .then((response) => {
                console.log(chalk.green('Test suite retrieved.'));
                return response.data;
            })
                .catch((error) => {
                console.log(chalk.red('Failed to retrieve test suite. Response message - ' + error));
                return error;
            });
        };
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
            if (this.options.includeAllInTestRun === false) {
                this.includeAll = false;
                if (this.options.groupIds) {
                    for (let i = 0; i < this.options.groupIds.length; i++) {
                        const subCaseIds = await this.getCases(suiteId, parseInt(this.options.groupIds[i]));
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