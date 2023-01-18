import { TestRailOptions } from './testrail.interface';
export declare class TestRailValidation {
    private options;
    constructor(options: TestRailOptions);
    validateReporterOptions(reporterOptions: object): object;
    private validate;
    /**
     * This function will validate do we pass suiteId as a CLI agrument as a part of command line execution
     * Example:
     * CYPRESS_ENV="testRailSuiteId=1"
     * npx cypress run --env="${CYPRESS_ENV}"
     */
    validateCLIArguments(): any;
}
