declare const fs: any;
declare const cacheFileName = "testrail-cache.txt";
declare let cacheData: any;
declare const fileExists: () => any;
declare const createFile: () => void;
declare const persist: () => void;
declare const load: () => void;
declare const TestRailCache: {
    store: (key: any, val: any) => void;
    retrieve: (key: any) => any;
    purge: () => void;
};
