const axios = require('axios');
const nock = require('nock')
const assert = require('assert');
const { Runner, Suite } = require('mocha');
const { CypressTestRailReporter } = require('../dist/cypress-testrail-reporter.js');
const { Status } = require('../dist/testrail.interface.js');
axios.defaults.adapter = require('axios/lib/adapters/http');
axios.defaults.baseURL = 'http://cypress-testrail-reporter.testrail.com';
const sinon = require('sinon');

describe('The correct actions are taken when a test event is triggered', function() {
  let suite;
  let runner;
  let testObject;

  beforeEach(function() {
    suite = new Suite('test suite');
    runner = new Runner(suite, false);
    testObject = {title: 'my testttt', duration: 1000, slow () {return 1}};
  });

  it('works as expected when tests have ended in a spec file', function() {
      runner.stats = {
          suites: 1,
          tests: 1,
          passes: 1,
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

      ctrp.submitResults = sinon.spy();
      runner.emit('end');
      sinon.assert.calledWithExactly(ctrp.submitResults);
      assert.deepStrictEqual(ctrp.caseResults, []);
      assert.deepStrictEqual(ctrp.caseIds, []);
  });
  it('works as expected when a test has passed', function() {
      const ctrp = new CypressTestRailReporter(runner, {
        reporterOptions: {
          'host': axios.defaults.baseURL,
          'suiteId': 1,
        }
      });

      ctrp.addToResults = sinon.spy();
      runner.emit('pass', testObject);
      sinon.assert.calledWithExactly(
          ctrp.addToResults, Status.Passed, testObject, 'Execution time: ' + testObject.duration + 'ms');
  })
  it('works as expected when a test has failed', function() {
      const ctrp = new CypressTestRailReporter(runner, {
        reporterOptions: {
          'host': axios.defaults.baseURL,
          'suiteId': 1,
        }
      });

      ctrp.addToResults = sinon.spy();
      runner.emit('fail', testObject, Error('test failed'));
      sinon.assert.calledWithExactly(
          ctrp.addToResults, Status.Failed, testObject, '' + 'test failed');
  })
  it('works as expected when a test has been set for a retry', function() {
    const ctrp = new CypressTestRailReporter(runner, {
      reporterOptions: {
        'host': axios.defaults.baseURL,
        'suiteId': 1,
      }
    });

    ctrp.addToResults = sinon.spy();
    runner.emit('retry', testObject);
    sinon.assert.calledWithExactly(
        ctrp.addToResults, Status.Retest, testObject, 'Cypress retry logic has been triggered!');
  })
})

describe('The addResults function', function() {
  it('works as expected when given valid values', function() {
      const suite = new Suite('test suite');
      const runner = new Runner(suite, false);
      const ctrp = new CypressTestRailReporter(runner, {
        reporterOptions: {
          'host': axios.defaults.baseURL,
          'suiteId': 1,
        }
      });
      const testObject = {title: 'C1234 This is an example test title', duration: 1000, slow () {return 1}};

      ctrp.addToResults(Status.Passed, testObject, 'Execution time: ' + testObject.duration + 'ms');
      ctrp.caseIds = [1234];
      this.caseResults = {
        case_id: 1234,
        status_id: 1,
        comment: '1000ms',
      };
  })
});

describe('The submitResults function', function() {
    it('works as expected when provided with only a suiteId', async function() {
        const suite = new Suite('test suite');
        const runner = new Runner(suite, false);
        runner.stats = {
            suites: 1,
            tests: 1,
            passes: 1,
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
            'cases': [ // cases found on TestRail
                {
                    'id': 1,
                    'title': 'My test 1',
                },
                {
                    'id': 2,
                    'title': 'My test 2',
                },
                {
                    'id': 3,
                    'title': 'My test 2',
                },
            ]
        })

      ctrp.caseIds = [1, 2, 3]; // local case ids

      // expected results to be sent to TestRail
      ctrp.caseResults = [
          {
              'case_id': 1,
              'status_id': 5,
              'comment': 'This test failed',
          },
          {
              'case_id': 2,
              'status_id': 1,
              'comment': 'This test passed',
          },
          {
              'case_id': 3,
              'status_id': 1,
              'comment': 'Assigned this test to Joe'
          },
        ]

      const publishResultsStub = sinon.stub(ctrp.testRailApi, 'publishResults');

      publishResultsStub.callsFake(() => {return Promise.resolve()});
      ctrp.submitResults();
      sinon.assert.calledWithExactly(publishResultsStub, ctrp.caseResults);

      scope.done()
    });
})
