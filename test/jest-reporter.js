// Exits with exit code 1 on failed test
class ExitCodeReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    // console.log('Custom reporter output:');
    // console.log('GlobalConfig: ', this._globalConfig);
    // console.log('Options: ', this._options);
    console.log("Results: ", results);
    if (results && results.numFailedTests === 0) {
      process.exit();
    } else {
      process.exit(1);
    }
  }
}

module.exports = ExitCodeReporter;
