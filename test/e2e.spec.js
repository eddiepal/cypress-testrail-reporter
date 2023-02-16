const axios = require('axios');
const nock = require('nock')
const assert = require('assert');
const { Runner, Suite } = require('mocha');
const { CypressTestRailReporter } = require('../dist/cypress-testrail-reporter.js');
const tests = require('./test-objects.json');
const sinon = require('sinon');
const { Status } = require('../dist/testrail.interface.js');
axios.defaults.adapter = require('axios/lib/adapters/http');
axios.defaults.baseURL = 'http://cypress-testrail-reporter.testrail.com';

describe('a test report from start to finish', function() {
  it('works as expected when given the test results and a suiteID', function() {
    const suite = new Suite('test suite');
    suite.passes = 1
    const runner = new Runner(suite, false);
    runner.stats = {
      suites: 1,
      tests: 0,
      passes: 0,
      pending: 0,
      failures: 0,
      start: new Date(),
      end: new Date(),
      duration: 1,
    };

    const ctrp = new CypressTestRailReporter(runner, {
      reporterOptions: {
        'host': axios.defaults.baseURL,
        'suiteId': 1,
      }
    });

    const publishResultsStub = sinon.stub(ctrp.testRailApi, 'publishResults');
    const casesForGetResponse = [];
    const expectedCaseResults = [];

    for (let i=0; i<tests.length; i++) {
      const test = tests[i];
      const testObject = {duration: test.duration, slow () {return 1}};
      testObject.title = (test.caseId) ? test.caseId + ' ' + test.title : test.title;

      if (test.status === 'Passed') {
        runner.emit('pass', testObject);
      }
      else if (test.status === 'Failed') {
        runner.emit('fail', testObject, test.error);
      }
      else if (test.status === 'Retest') {
        runner.emit('retry', testObject);
      }

      if (test.existsInTestRail) {
        casesForGetResponse.push({id: parseInt(test.caseId.slice(1)), title: test.title})
        expectedCaseResults.push({case_id: test.caseId.slice(1), status_id: Status[test.status]})
      }
    }

    const scope = nock(axios.defaults.baseURL)
    .get('/index.php?/api/v2/get_cases/undefined&suite_id=1&limit=250&offset=0')
    .reply(200, {
        'offset': 0,
        'limit': 250,
        'size': 250,
        '_links': {
            'next': null,
            'prev': null
        },
        'cases': casesForGetResponse
    })

    publishResultsStub.callsFake(() => {return Promise.resolve()});
    runner.emit('end');
    sinon.assert.called(publishResultsStub);
    const publishResultsStubArg = publishResultsStub.getCall(0).args[0];
    publishResultsStubArg.forEach((item1, index) => {
      const item2 = expectedCaseResults[index];
      assert.equal(item1.case_id, item2.case_id);
      assert.equal(item1.status_id, item2.status_id);
      assert.equal(typeof item1.comment, 'string');
    });
    scope.done();
  });
});
