import { TestRailOptions, TestRailResult } from './testrail.interface';
export declare class TestRail {
    private options;
    private base;
    private urlToPage;
    private runId;
    private includeAll;
    private caseIds;
    constructor(options: TestRailOptions);
    getCases: (suiteId: number, groupId: number | undefined) => Promise<number[]>;
    createRun: (name: string, host: string, description: string, suiteId: number) => Promise<void>;
    deleteRun: () => void;
    publishResults: (results: TestRailResult[]) => any;
    uploadAttachment(resultId: number, path: string): void;
    uploadScreenshots: (caseId: string, resultId: number, _path: string) => void;
    uploadDownloads: (caseId: number, resultId: number, _path: string) => void;
    uploadVideos: (caseId: number, resultId: number, _path: string) => void;
    closeRun: () => void;
}
