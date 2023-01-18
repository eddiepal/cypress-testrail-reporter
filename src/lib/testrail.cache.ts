const fs = require('fs');
const cacheFileName = 'testrail-cache.txt';
let cacheData = {};
const fileExists = function() {
  return fs.existsSync(cacheFileName);
};
const createFile = function() {
  fs.writeFileSync(cacheFileName, '');
};
const persist = function() {
  fs.writeFileSync(cacheFileName, JSON.stringify(cacheData), {
    flag: 'w',
  });
};
const load = function() {
  if (!fileExists()) {
    createFile();
  }
  const dataStr = fs.readFileSync(cacheFileName);
  if (dataStr && dataStr != '') {
    cacheData = JSON.parse(dataStr);
  }
  else {
    cacheData = {};
  }
};
const TestRailCache = {
  store: function(key, val) {
    cacheData[key] = val;
    persist();
  },
  retrieve: function(key) {
    load();
    return cacheData[key];
  },
  purge: function() {
    if (fileExists()) {
      fs.unlink(cacheFileName, (err) => {
        if (err) {
          throw err;
        }
      });
    }
    cacheData = {};
  },
};
module.exports = TestRailCache;
