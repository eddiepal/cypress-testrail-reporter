/**
 * Search for all applicable test cases
 * @param title
 * @returns {any}
 */
 export function titleToCaseIds(title: string): number[] {
  const caseIds: number[] = [];
  const testCaseIdRegExp = /\bT?C(\d+)\b/g;
  let m;
  while ((m = testCaseIdRegExp.exec(title)) !== null) {
    const caseId = parseInt(m[1]);
    caseIds.push(caseId);
  }
  return caseIds;
}
