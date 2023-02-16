const assert = require('assert');
const { titleToCaseIds } = require('../dist/shared.js');

const validTitles = {
  'C1': [1],
  'C123456789': [123456789],
  'C1 C123456789': [1, 123456789],
  'C1 This is my test title': [1],
  'C1 C123456789 This is my test title': [1, 123456789],
  'C1 C123456789 C1azy test title': [1, 123456789],
};

const invalidTitles = [
  '1',
  'C 123456789',
  'C 1 C 123456789',
  'CC1 This is my test title',
  'C1234This is my test title',
  '1234C This is my test title',
];

describe('The correct IDs are returned from the given test title', function() {

  /* eslint-disable mocha/no-setup-in-describe */
  for (const [key, value] of Object.entries(validTitles)) {
    it(`returns all IDs from given string '${key}'`, function() {
      const result = titleToCaseIds(key);
      assert.deepStrictEqual(result, value);
    });
  }

  /* eslint-disable mocha/no-setup-in-describe */
  invalidTitles.forEach((val) => {
    it(`returns no IDs from given string '${val}'`, function() {
      const result = titleToCaseIds(val);
      assert.deepStrictEqual(result, []);
    });
  })
});
