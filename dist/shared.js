'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
exports.titleToCaseIds = void 0;
/**
 * Search for all applicable test cases
 * @param {string} title
 * @return {any}
 */
function titleToCaseIds(title) {
  const caseIds = [];
  const testCaseIdRegExp = /\bT?C(\d+)\b/g;
  let m;
  while ((m = testCaseIdRegExp.exec(title)) !== null) {
    const caseId = parseInt(m[1]);
    caseIds.push(caseId);
  }
  return caseIds;
}
exports.titleToCaseIds = titleToCaseIds;
// # sourceMappingURL=shared.js.map
