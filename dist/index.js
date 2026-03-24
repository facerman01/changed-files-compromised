/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 901:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 226:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const core = __nccwpck_require__(901);
const github = __nccwpck_require__(226);

async function run() {
  try {
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);
    const context = github.context;

    // 1. Identify the commits to compare
    // If it's a Pull Request, compare base vs head. 
    // If it's a Push, compare before vs after.
    const base = context.payload.pull_request?.base.sha || context.payload.before;
    const head = context.payload.pull_request?.head.sha || context.payload.after;

    if (!base || !head) {
      core.setFailed("Could not determine base and head commits.");
      return;
    }

    core.info(`Comparing ${base} to ${head}...`);

    // 2. Request comparison data from GitHub API
    const { data: comparison } = await octokit.rest.repos.compareCommits({
      owner: context.repo.owner,
      repo: context.repo.repo,
      base,
      head,
    });

    // 3. Extract line change stats
    // The GitHub API returns a 'files' array and a global 'files' summary
    // 'changes' usually equals insertions + deletions
    const insertions = comparison.files.reduce((acc, file) => acc + file.additions, 0);
    const deletions = comparison.files.reduce((acc, file) => acc + file.deletions, 0);
    const total = insertions + deletions;

    // 4. Output the results
    core.setOutput('insertions', insertions);
    core.setOutput('deletions', deletions);
    core.setOutput('total_changes', total);

    core.info(`📈 Statistics:`);
    core.info(`   + ${insertions} insertions`);
    core.info(`   - ${deletions} deletions`);
    core.info(`   Σ ${total} total lines changed`);

    // Example logic: Warn if the PR is too big (e.g., > 500 lines)
    if (total > 500) {
      core.warning("⚠️ This commit/PR is quite large. Consider breaking it down for easier review.");
    }

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
module.exports = __webpack_exports__;
/******/ })()
;