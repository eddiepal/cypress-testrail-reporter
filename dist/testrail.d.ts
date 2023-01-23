import { TestRailOptions, TestRailResult } from './testrail.interface';
export declare class TestRail {
    private options;
    private base;
    private urlToPage;
    private runId;
    private includeAll;
    private caseIds;
    constructor(options: TestRailOptions);
    getSuite: (suiteId: number) => Promise<void>;
    getCases: (suiteId: number, groupId: number | undefined) => Promise<number[]>;
    createRun: (name: string, host: string, description: string, suiteId: number) => Promise<void>;
    deleteRun: () => void;
    publishResults: (results: TestRailResult[]) => any;
    uploadAttachment(resultId: number, path: string): void;
}
