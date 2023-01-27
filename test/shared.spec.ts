/* eslint-disable node/no-unpublished-import */
/* eslint-disable node/no-unpublished-require */
import * as assert from 'assert';
import { titleToCaseIds } from '../src/lib/shared';

const exampleValues = {
  'C1': [1],
  'C123456789': [123456789],
  'C1 C123456789': [1, 123456789],
  'C1 This is my test title': [1],
  'C1 C123456789 This is my test title': [1, 123456789],
  'C1 C123456789 C1azy test title': [1, 123456789],
};

const invalidValues = {
  '1': [1],
  'C 123456789': [],
  'C 1 C 123456789': [1, 123456789],
  'CC1 This is my test title': [1],
  'C1234This is my test title': [1],
  '1234C This is my test title': [1, 123456789],
};

describe('The correct IDs are returned from the given test title', () => {
  for (const [key, value] of Object.entries(exampleValues)) {
    it(`returns all IDs from given string '${key}'`, () => {
      const result = titleToCaseIds(key);
      assert.deepStrictEqual(result, value);
    });
  }

  for (const [key] of Object.entries(invalidValues)) {
    it(`returns no IDs from given string '${key}'`, () => {
      const result = titleToCaseIds(key);
      assert.deepStrictEqual(result, []);
    });
  }
});
