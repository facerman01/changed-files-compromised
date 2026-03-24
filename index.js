const core = require('@actions/core');
const github = require('@actions/github');

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