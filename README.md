# TestRail Reporter for Cypress (forked version of [cypress-testrail-reporter](https://www.npmjs.com/package/@mkonate/cypress-testrail-reporter))

Publishes [Cypress](https://www.cypress.io/) runs on TestRail.

### New features:
- Test results are only uploaded after each file as opposed to after each test. This can greatly reduce the time it takes to complete a test run as well as prevent
freezing test runs, due to the decreased number of API calls.
- Deasync code has only been added at the end of each spec file. This prevents cypress runner from exiting the node process before the test results are uploaded. Only two requests are made at the end of each spec file. One to get the valid test cases and one to upload the test results. This should also help reduce any change of hitting API limits.
- Unit tests added to help prevent future regressions.
- Note that this version has some [temporarily removed features](#temporarily-removed-features).
  
### Core features:
- Possibility to aggregate multiple sections of a same test suite to one test run (**see groupId option**)
- Test results are aggregated under the same test run if you are executing more spec(test) files and they are belongs to the same suite
- Multi suite project support (set **suiteId=1** in **cypress.json** or set it as a part of runtime environment variables as **testRailSuiteId=1**)
- Reporting retest status of a test cases - handy in terms of marking tests as flaky (test is reported with retest status for the first try and after second try it passes) Note: cypress retry logic must be enabled for this feature.

### Temporarily removed features
- Possibility to upload videos for failed test cases - optional (**allowOnFailureVideoUpload: true**)
- Possibility to upload downloads folder for all test cases - optional (**allowExportDownloads: true**)
- Possibility to upload screenshots for failed  test cases - optional (**allowOnFailureScreenshotUpload: true**)
- Possibility to precise the runId of a manually created test run on TestRail(**see runId option**)

## Install

```shell
$ npm install @eddiepal/cypress-testrail-reporter --save-dev
```

## Usage

Add reporter to your `cypress.json`:

```json
...
"reporter": "cypress-testrail-reporter",
"reporterOptions": {
  "host": "https://yourdomain.testrail.com",
  "username": "username",
  "password": "password",
  "projectId": 1,
  "suiteId": 1,
}
```

Your Cypress tests should include the ID of your TestRail test case. Make sure your test case IDs are distinct from your test titles:

```Javascript
// Good:
it("C123 C124 Can authenticate a valid user", ...
it("Can authenticate a valid user C321", ...

// Bad:
it("C123Can authenticate a valid user", ...
it("Can authenticate a valid userC123", ...
```

## Reporter Options

**host**: _string_ host of your TestRail instance (e.g. for a hosted instance _https://instance.testrail.com_).

**username**: _string_ email of the user under which the test run will be created. When you set `CYPRESS_TESTRAIL_REPORTER_USERNAME` in
environment variables, this option would be overwritten with it.

**password**: _string_ password or the API key for the aforementioned user. When you set `CYPRESS_TESTRAIL_REPORTER_PASSWORD` in runtime environment variables, this option would be overwritten with it.

**projectId**: _number_ project with the associated tests.

**suiteId**: _number_ suite with the associated tests. Optional under **cypress.json** file in case that you define **suiteId** under **gitlab-ci.yml** file or set this value in runtime environment varables.

**runName**: _string_ (optional) name of the Testrail run. When you set `CYPRESS_TESTRAIL_REPORTER_RUNNAME` in runtime environment variables, this option would be overwritten with it.

**disableDescription**: _bool_ (optional: default is false) possibility to disable description for test run in case that someone don’t have cypress dashboard feature (_disableDescription: true_)

**allowOnFailureScreenshotUpload**: _bool_ (optional: default is false) will upload failed screenshot to corresponding test result comment for easier debugging of failure. (Required: `screenshotOnRunFailure` option must be set to true in cypress.json )

**allowOnFailureVideoUpload**: _bool_ (optional: default is false) will upload a video of the test to the corresponding test result comment. (Required: `video` option must be set to true in cypress.json)

**allowExportDownloads** : _bool_ (optional: default is false) will upload the cypress downloads folder to the test run. (**Note** : This setting is useful if you are downloading files in your automated tests. Be advised that you have the resposability to cleanup your cypress downloads folder) 

**includeAllInTestRun**: _bool_ (optional: default is true) will return all test cases in test run. Set to false to return test runs based on filter or section/group.

**groupId**: _string_ (optional: needs "includeAllInTestRun": false ) A comma separated list of IDs of the sections/groups. When you set `CYPRESS_TESTRAIL_REPORTER_GROUPID` in runtime environment variables, this option would be overwritten with it.

**filter**: _string_ (optional: needs "includeAllInTestRun": false) Only return cases with matching filter string in the case title.

**runId**: _number_ will aggregate the test cases to the test run ID entered. When you set `CYPRESS_TESTRAIL_REPORTER_RUNID` in runtime environment variables, this option would be overwritten with it.

## Multiple suite

This reporter can handle multiple suite projects in TestRail. In order to use it, don't define **suiteId** under **cypress.json** file and instead pass the **testRailSuiteId** variable when you define all other CLI arguments for cypress execution. If you are using a CI integration solution (e.g. GitLab), **testRailSuiteId** can be set before every pipeline job or predefined for each spec (test) file for which **suiteId** belongs to.

**gitlab-ci.yml** file (Here you can pass **suiteId** as a variable):

```Javascript

e2e_test1:
  script:
    - e2e-setup.sh
  variables:
    CYPRESS_SPEC: "cypress/integration/dashboard/*"
    TESTRAIL_SUITEID: 1

e2e_test2:
  script:
    - e2e-setup.sh
  variables:
    CYPRESS_SPEC: "cypress/integration/login/*"
    TESTRAIL_SUITEID: 2
```

and use it later during cypress run:

**e2e-setup.sh** file

```Javascript

CYPRESS_OPTIONS="baseUrl=${url},trashAssetsBeforeRuns=false,video=${video},screenshotOnRunFailure=${screenshotOnRunFailure}"
CYPRESS_ENV="testRailSuiteId=${TESTRAIL_SUITEID}"

npx cypress run --headed --browser chrome --config "${CYPRESS_OPTIONS}" --env="${CYPRESS_ENV}" --spec "${CYPRESS_SPEC}"
```

## Cucumber preprocessor

This reporter can miss spec files if they are suffixed as **.feature** or if you are not using the default **cypress/integration** folder. In order to use it with the [Cucumber Preprocessor](https://github.com/badeball/cypress-cucumber-preprocessor), you should pass the location of your spec files **cypress/tests/\*\*/\*.feature** when you define all other CLI arguments for cypress execution (through command line). If you are using a CI integration solution (e.g. GitLab), **CYPRESS_SPEC** can be set before every pipeline job

```Javascript

CYPRESS_SPEC="cypress/tests/**/*.feature"

npx cypress run --headed --browser chrome --spec "${CYPRESS_SPEC}"
```

## TestRail Settings

To increase security, the TestRail team suggests using an API key instead of a password. You can see how to generate an API key [here](http://docs.gurock.com/testrail-api2/accessing#username_and_api_key).

If you maintain your own TestRail instance on your own server, it is recommended to [enable HTTPS for your TestRail installation](http://docs.gurock.com/testrail-admin/admin-securing#using_https).

For TestRail hosted accounts maintained by [Gurock](http://www.gurock.com/), all accounts will automatically use HTTPS.

You can read the whole TestRail documentation [here](http://docs.gurock.com/).

## Author

Matt Charlton - [github](https://github.com/mncharlton)

## Core contributors

- [Milutin Savovic](https://github.com/mickosav)
- [Anes Topcic](https://github.com/sakalaca)
- [FFdhorkin](https://github.com/FFdhorkin)

## License

This project is licensed under the [MIT license](/LICENSE.md).

## Acknowledgments

- [Pierre Awaragi](https://github.com/awaragi), owner of the [mocha-testrail-reporter](https://github.com/awaragi/mocha-testrail-reporter) repository that was forked.
- [Valerie Thoma](https://github.com/ValerieThoma) and [Aileen Santos](https://github.com/asantos3026) for proofreading the README.md file and making it more understandable.
- [Milutin Savovic](https://github.com/mickosav), creator of the the original [cypress-testrail-reporter](https://github.com/Vivify-Ideas/cypress-testrail-reporter)
