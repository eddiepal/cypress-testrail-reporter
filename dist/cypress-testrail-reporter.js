"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.CypressTestRailReporter = void 0;
var mocha_1 = require("mocha");
var moment = require("moment");
var testrail_1 = require("./testrail");
var shared_1 = require("./shared");
var testrail_interface_1 = require("./testrail.interface");
var testrail_validation_1 = require("./testrail.validation");
var TestRailCache = require('./testrail.cache');
var TestRailLogger = require('./testrail.logger');
var deasync = require('deasync');
var chalk = require('chalk');
var runCounter = 1;
var CypressTestRailReporter = /** @class */ (function (_super) {
    __extends(CypressTestRailReporter, _super);
    function CypressTestRailReporter(runner, options) {
        var _this = _super.call(this, runner) || this;
        _this.results = [];
        _this.suiteId = [];
        _this.groupId = '';
        _this.caseIds = [];
        _this.caseResults = [];
        /**
         * @param {int} status The test status.
         * @param {object} test The test object.
         * @param {string} comment The test comment.
       */
        _this.addToResults = function (status, test, comment) { return __awaiter(_this, void 0, void 0, function () {
            var caseID, caseResult;
            return __generator(this, function (_a) {
                caseID = (0, shared_1.titleToCaseIds)(test.title)[0];
                this.caseIds.push(caseID);
                caseResult = {
                    case_id: caseID,
                    status_id: status,
                    comment: comment,
                };
                this.caseResults.push(caseResult);
                return [2 /*return*/];
            });
        }); };
        /**
         * Ensure that after each test results are reported continuously
         * Additionally to that if test status is failed or retried there is possibility
         * to upload failed screenshot for easier debugging in TestRail
         * Note: Uploading of screenshot is configurable option
       */
        _this.submitResults = function () {
            // TODO: refactor to work with request changes
            // let _a;
            // let filePath;
            var listGroupIds = _this.reporterOptions.groupId;
            var serverCaseIds = [];
            var done = false;
            // if (test.invocationDetails !== undefined) {
            //   filePath = test.invocationDetails.absoluteFile;
            //   TestRailCache.store('screenshotPath', filePath);
            // } else {
            //   filePath = TestRailCache.retrieve('screenshotPath');
            // }
            (function () { return __awaiter(_this, void 0, void 0, function () {
                var groupIDS, i, subCaseIds, invalidCaseIds, validCaseIDs, publishedResults;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(this.reporterOptions.includeAllInTestRun === false)) return [3 /*break*/, 6];
                            if (!listGroupIds) return [3 /*break*/, 5];
                            groupIDS = listGroupIds.toString().split(',');
                            i = 0;
                            _a.label = 1;
                        case 1:
                            if (!(i < groupIDS.length)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.testRailApi.getCases(this.reporterOptions.suiteId, groupIDS[i])];
                        case 2:
                            subCaseIds = _a.sent();
                            serverCaseIds = Array.prototype.concat(serverCaseIds, subCaseIds);
                            _a.label = 3;
                        case 3:
                            i++;
                            return [3 /*break*/, 1];
                        case 4: return [3 /*break*/, 5];
                        case 5: return [3 /*break*/, 8];
                        case 6: return [4 /*yield*/, this.testRailApi.getCases(this.reporterOptions.suiteId, undefined)];
                        case 7:
                            serverCaseIds = _a.sent();
                            _a.label = 8;
                        case 8:
                            invalidCaseIds = this.caseIds.filter(function (caseId) {
                                return !Array.from(serverCaseIds).includes(caseId);
                            });
                            validCaseIDs = this.caseIds.filter(function (caseId) {
                                return Array.from(serverCaseIds).includes(caseId);
                            });
                            if (invalidCaseIds.length > 0) {
                                console.log(chalk.rgb(255, 165, 0)('WARNING: The following case IDs were found in the current spec file, but not found in TestRail: ' +
                                    invalidCaseIds + '\n'));
                            }
                            return [4 /*yield*/, this.testRailApi.publishResults(this.caseResults.filter(function (x) { return validCaseIDs.includes(x.case_id); })).then(function () {
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
                            ];
                        case 9:
                            publishedResults = _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); })();
            require('deasync').loopWhile(function () { return !done; });
        };
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
        _this.testRailApi = new testrail_1.TestRail(_this.reporterOptions);
        _this.testRailValidation = new testrail_validation_1.TestRailValidation(_this.reporterOptions);
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
        var cliArguments = _this.testRailValidation.validateCLIArguments();
        if (cliArguments && cliArguments.length) {
            _this.suiteId = cliArguments;
        }
        /**
         * If no suiteId has been passed with previous two methods
         * runner will not be triggered
         */
        if (_this.suiteId && _this.suiteId.toString().length) {
            runner.on('start', function () {
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
                    var executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
                    var name1 = (_this.reporterOptions.runName || 'Automated test run') + ' ' + executionDateTime;
                    var description = '';
                    if (_this.reporterOptions.disableDescription) {
                        description = '';
                    }
                    else if (process.env.CYPRESS_CI_JOB_URL) {
                        description = process.env.CYPRESS_CI_JOB_URL;
                    }
                    else {
                        description = 'For the Cypress run visit https://dashboard.cypress.io/#/projects/runs';
                    }
                    TestRailLogger.log('Creating TestRail Run with name: ' + name1);
                    _this.testRailApi.createRun(name1, _this.reporterOptions.host, description, _this.suiteId);
                }
                else {
                    // use the cached TestRail Run ID
                    _this.runId = TestRailCache.retrieve('runId');
                    TestRailLogger.log('Using existing TestRail Run with ID: \'' + _this.runId + '\'');
                }
            });
            runner.on('pass', function (test) {
                _this.addToResults(testrail_interface_1.Status.Passed, test, 'Execution time: ' + test.duration + 'ms');
            });
            runner.on('fail', function (test, err) {
                _this.addToResults(testrail_interface_1.Status.Failed, test, '' + err.message);
            });
            runner.on('retry', function (test) {
                _this.addToResults(testrail_interface_1.Status.Retest, test, 'Cypress retry logic has been triggered!');
            });
            runner.on('end', function () {
                _this.submitResults();
                _this.caseResults = [];
                _this.caseIds = [];
            });
        }
        return _this;
    }
    return CypressTestRailReporter;
}(mocha_1.reporters.Spec));
exports.CypressTestRailReporter = CypressTestRailReporter;
//# sourceMappingURL=cypress-testrail-reporter.js.map