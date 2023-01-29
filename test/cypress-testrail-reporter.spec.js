const axios = require('axios');
const nock = require('nock')
const assert = require('assert');
const { Runner, Suite } = require('mocha');
const { CypressTestRailReporter } = require('../dist/cypress-testrail-reporter.js');
const { Status } = require('../dist/testrail.interface.js');
axios.defaults.adapter = require('axios/lib/adapters/http');
axios.defaults.baseURL = 'http://localhost';
const sinon = require('sinon');

describe('my test', function() {
  let consoleSpy;

  beforeEach(function() {
    consoleSpy = sinon.spy(console, 'log');
  });

  afterEach(function() {
    consoleSpy.restore();
  });

  it('should print something to the console', function() {
    // call the code you want to test
    const suite = new Suite('test suite');
    const runner = new Runner(suite, false);

    // myEventEmitter.on('myEvent', (data) => {
    //   assert.strictEqual(data, 'Event fired!');
    // });

    // runner.emit('hellothere');

    new CypressTestRailReporter(runner, {
      reporterOptions: {
        'host': 'http://localhost',
        'suiteId': 1,
      }
    });

    runner.emit('pass', {title: 'my test', duration: 1000, slow () {return 1}, fullTitle () {return 'my test'}});

    // assert(consoleSpy.calledOnce);
    // assert.deepStrictEqual(consoleSpy.getCall(0).args, ['HEYYY']);
  });
});

describe('The correct actions are taken when a test event is triggered', function() {
    it('works as expected when tests have ended in a spec file', function() {
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
            'host': 'http://localhost',
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
        const suite = new Suite('test suite');
        const runner = new Runner(suite, false);
        const testObject = {title: 'my test', duration: 1000, slow () {return 1}, fullTitle () {return 'my test'}};
        const ctrp = new CypressTestRailReporter(runner, {
          reporterOptions: {
            'host': 'http://localhost',
            'suiteId': 1,
          }
        });

        ctrp.addToResults = sinon.spy();
        runner.emit('pass', testObject);
        sinon.assert.calledWithExactly(
            ctrp.addToResults, Status.Passed, testObject, 'Execution time: ' + testObject.duration + 'ms');
    })
    it('works as expected when a test has failed', function() {
        const suite = new Suite('test suite');
        const runner = new Runner(suite, false);
        const testObject = {title: 'my test', duration: 1000, slow () {return 1}, fullTitle () {return 'my test'}};
        const ctrp = new CypressTestRailReporter(runner, {
          reporterOptions: {
            'host': 'http://localhost',
            'suiteId': 1,
          }
        });

        ctrp.addToResults = sinon.spy();
        runner.emit('fail', testObject, Error('test failed'));
        sinon.assert.calledWithExactly(
            ctrp.addToResults, Status.Failed, testObject, '' + 'test failed');
    })
})

describe('The submitResults function works as expected', function() {
    it('works as expected when tests have ended in a spec file', async function() {
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
            'host': 'http://hellothere.com',
            'suiteId': 1,
          }
        });

        const scope = nock('http://hellothere.com')
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


// // test in mocha to test the addResults function in the cyress-testrail-reporter.js file
// it('can fetch test response', async () => {
//   const suite = new Suite('test suite');
//   const runner = new Runner(suite, false);

//   // myEventEmitter.on('myEvent', (data) => {
//   //   assert.strictEqual(data, 'Event fired!');
//   // });
//   runner.emit('hellothere');


//   const myObject = new CypressTestRailReporter(runner, {
//     reporterOptions: {
//       'host': 'http://localhost',
//     }
//   });

//   runner.emit('hellothere');


//   // // Set up the mock request.
//   // const scope = nock('http://localhost')
//   //   .post('/add_result_for_case/')
//   //   .reply(200, 'test response')

//   await myObject.addToResults(1, {'title': 'C12345 User can login to the site'}, 'test comment');

//   assert.deepStrictEqual(myObject.caseResults, [{ case_id: 12345, status_id: 1, comment: 'test comment' }]);

//   // Assert that the expected request was made.
//   // scope.done();
// });


// test('can fetch test response', async t => {
//   // Set up the mock request.
//   const scope = nock('http://localhost')
//     .get('/test')
//     .reply(200, 'test response')

//   // Make the request. Note that the hostname must match exactly what is passed
//   // to `nock()`. Alternatively you can set `axios.defaults.host = 'http://localhost'`
//   // and run `axios.get('/test')`.
//   await axios.get('http://localhost/test')

//   // Assert that the expected request was made.
//   scope.done()
// })

// // test('can fetch test response', async () => {
// //   const myObject = new CypressTestRailReporter();

// //   // Set up the mock request.
// //   const scope = nock('http://localhost')
// //     .post('/add_result_for_case/1/1')
// //     .reply(404, 'Failed');

// //   await CypressTestRailReporter.addToResults(1, 1, {});

// //   // Assert that the expected request was made.
// //   scope.done();
// // });
