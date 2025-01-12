import { reporters } from 'mocha';
export declare class CypressTestRailReporter extends reporters.Spec {
    private results;
    private testRailApi;
    private testRailValidation;
    private runId;
    private reporterOptions;
    private suiteId;
    private groupId;
    private caseIds;
    private caseResults;
    constructor(runner: any, options: any);
    /**
     * @param {int} status The test status.
     * @param {object} test The test object.
     * @param {string} comment The test comment.
   */
    addToResults: (status: number, test: any, comment: string) => Promise<void>;
    /**
     * Ensure that after each test results are reported continuously
     * Additionally to that if test status is failed or retried there is possibility
     * to upload failed screenshot for easier debugging in TestRail
     * Note: Uploading of screenshot is configurable option
   */
    submitResults: () => void;
}
