"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRail = void 0;
require('path');
var axios = require('axios');
var fs = require('fs');
var TestRailLogger = require('./testrail.logger');
var TestRailCache = require('./testrail.cache');
var chalk = require('chalk');
var FormData = require('form-data');
require('deasync');
var TestRail = /** @class */ (function () {
    // private retries: Number;
    function TestRail(options) {
        var _this = this;
        this.options = options;
        this.includeAll = true;
        this.caseIds = [];
        this.getCases = function (suiteId, groupId) { return __awaiter(_this, void 0, void 0, function () {
            var url, initialUrl, caseIdArray, nextPage, newUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.base + '/get_cases/' + this.options.projectId + '&suite_id=' + suiteId;
                        initialUrl = this.urlToPage;
                        caseIdArray = [];
                        nextPage = '';
                        newUrl = '';
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
                        _a.label = 1;
                    case 1:
                        if (!(nextPage !== null)) return [3 /*break*/, 3];
                        return [4 /*yield*/, axios({
                                method: 'get',
                                url: newUrl,
                                headers: { 'Content-Type': 'application/json' },
                                auth: {
                                    username: this.options.username,
                                    password: this.options.password,
                                },
                            }).then(function (response) {
                                nextPage = response.data._links.next;
                                caseIdArray = caseIdArray.concat(response.data.cases.map(function (item) {
                                    return item.id;
                                }));
                                newUrl = initialUrl + nextPage;
                                if (nextPage === null) {
                                    console.log(chalk.green('Test cases retrieved.\n'));
                                }
                            })
                                .catch(function (error) {
                                console.log(chalk.red('\nFailed to retrieve test cases. Response message - ' + error));
                                return console.error(error);
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/, caseIdArray];
                }
            });
        }); };
        this.createRun = function (name, host, description, suiteId) { return __awaiter(_this, void 0, void 0, function () {
            var _host, listGroupIds, groupIDS, i, subCaseIds, _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _host = host;
                        listGroupIds = this.options.groupId;
                        if (!(this.options.includeAllInTestRun === false)) return [3 /*break*/, 7];
                        this.includeAll = false;
                        if (!listGroupIds) return [3 /*break*/, 5];
                        groupIDS = listGroupIds.toString().split(',');
                        i = 0;
                        _b.label = 1;
                    case 1:
                        if (!(i < groupIDS.length)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getCases(suiteId, parseInt(groupIDS[i]))];
                    case 2:
                        subCaseIds = _b.sent();
                        this.caseIds = Array.prototype.concat(this.caseIds, subCaseIds);
                        _b.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        _a = this;
                        return [4 /*yield*/, this.getCases(suiteId, undefined)];
                    case 6:
                        _a.caseIds = _b.sent();
                        _b.label = 7;
                    case 7:
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
                            .then(function (response) {
                            _this.runId = response.data.id;
                            // cache the TestRail Run ID
                            TestRailCache.store('runId', _this.runId);
                            var path = 'runs/view/' + _this.runId;
                            TestRailLogger.log('Results are published to ' + chalk.magenta(_host + '/index.php?/' + path));
                        })
                            .catch(function (error) {
                            return console.error(error);
                        });
                        return [2 /*return*/];
                }
            });
        }); };
        this.deleteRun = function () {
            _this.runId = TestRailCache.retrieve('runId');
            axios({
                method: 'post',
                url: _this.base + '/delete_run/' + _this.runId,
                headers: { 'Content-Type': 'application/json' },
                auth: {
                    username: _this.options.username,
                    password: _this.options.password,
                },
            }).catch(function (error) {
                return console.error(error);
            });
        };
        this.publishResults = function (results) {
            _this.runId = TestRailCache.retrieve('runId');
            console.log(chalk.blue('Adding results from current spec file to TestRail...'));
            return axios({
                method: 'post',
                url: _this.base + '/add_results_for_cases/' + _this.runId,
                headers: { 'Content-Type': 'application/json' },
                auth: {
                    username: _this.options.username,
                    password: _this.options.password,
                },
                data: JSON.stringify({ results: results }),
            })
                .then(function (response) {
                console.log(chalk.green('Results added to test run.'));
                return response.data;
            })
                .catch(function (error) {
                console.log(chalk.red('Failed to add results to TestRail. Response message - ' + error));
            });
        };
        // This function will attach failed screenshot on each test result(comment) if founds it
        this.uploadScreenshots = function (caseId, resultId, _path) {
            var SCREENSHOTS_FOLDER_PATH = _path.replace('integration', 'screenshots');
            fs.readdir(SCREENSHOTS_FOLDER_PATH, function (err, files) {
                if (err) {
                    return console.log('Unable to scan screenshots folder: ' + err);
                }
                files.forEach(function (file) {
                    if (file.includes('C' + caseId) && /(failed|attempt)/g.test(file)) {
                        try {
                            _this.uploadAttachment(resultId, SCREENSHOTS_FOLDER_PATH + '/' + file);
                        }
                        catch (err) {
                            console.log('Screenshot upload error: ', err);
                        }
                    }
                });
            });
        };
        this.uploadDownloads = function (caseId, resultId, _path) {
            var DOWNLOADS_FOLDER_PATH = _path.split('cypress')[0] + 'cypress/downloads';
            fs.readdir(DOWNLOADS_FOLDER_PATH, function (err, files) {
                if (err) {
                    return console.log('Unable to scan downloads folder: ' + err);
                }
                files.forEach(function (file) {
                    try {
                        _this.uploadAttachment(resultId, DOWNLOADS_FOLDER_PATH + '/' + file);
                    }
                    catch (err) {
                        console.log('Download upload error: ', err);
                    }
                });
            });
        };
        this.uploadVideos = function (caseId, resultId, _path) {
            var vPath = _path.replace('integration', 'videos');
            var VIDEOS_FOLDER_PATH = vPath.replace(/([^/]*js)$/g, '');
            var vidName = vPath.slice(vPath.lastIndexOf('/')).replace('/', '');
            var fork = require('child_process').fork;
            var child = fork(__dirname + '/publishVideo.js', {
                detached: true,
                stdio: 'inherit',
                env: Object.assign(process.env, {
                    vName: vidName,
                    vFolder: VIDEOS_FOLDER_PATH,
                    resId: resultId,
                    base: _this.base,
                    username: _this.options.username,
                    pwd: _this.options.password,
                }),
            }).unref();
        };
        this.closeRun = function () {
            _this.runId = TestRailCache.retrieve('runId');
            axios({
                method: 'post',
                url: _this.base + '/close_run/' + _this.runId,
                headers: { 'Content-Type': 'application/json' },
                auth: {
                    username: _this.options.username,
                    password: _this.options.password,
                },
            })
                .then(function () {
                TestRailLogger.log('Test run closed successfully');
            })
                .catch(function (error) {
                return console.error(error);
            });
        };
        this.base = "".concat(options.host, "/index.php?/api/v2");
        this.urlToPage = options.host + '/index.php?';
    }
    TestRail.prototype.uploadAttachment = function (resultId, path) {
        var form = new FormData();
        form.append('attachment', fs.createReadStream(path));
        axios({
            method: 'post',
            url: "".concat(this.base, "/add_attachment_to_result/").concat(resultId),
            headers: __assign({}, form.getHeaders()),
            auth: {
                username: this.options.username,
                password: this.options.password,
            },
            data: form,
        });
    };
    return TestRail;
}());
exports.TestRail = TestRail;
//# sourceMappingURL=testrail.js.map