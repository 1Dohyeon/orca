# CLAUDE.md

@AGENTS.md

## Language Rule

- Write everything that lands in this repository in English: code, comments, docs, commit messages, branch names, and PR text.
- Reply to the user in the user's configured language. Only repository artifacts follow the English rule.
- Comments that Claude posts on pull requests from CI (`@claude` reviews, inline comments, and replies) are PR text. Write them in English.

## Test Runs

This fork is a personal customization, so unit tests cover only the files a change touches. This replaces the `pnpm check:changed` run before every push that `AGENTS.md` asks for.

- Run the tests in the folders of the changed files with `pnpm test <folders> --maxWorkers=2`. For an upstream sync, the changed files are the custom ones, listed by `git diff --name-only main develop`.
- Still run `pnpm tc`, plus `pnpm exec oxlint` and `pnpm exec oxfmt --check` on the changed files.
- Report which folders were tested and that the full suite was not run.
- Run `pnpm check:changed` only when the user asks. It runs the full unit test suite (about 8 minutes) and truncates long output, so run it once and keep everything you need from that run.
- Redirect the full test output to a file in the session scratchpad, then read the failure list from that file. Do not rerun tests just to see which ones failed.
- Before blaming or clearing your change, run the failing test files on the base checkout (`develop`) with `pnpm test <files> --maxWorkers=2`. Report failures that also fail on the base as pre-existing, and the rest as possibly caused by the change.
- Tests under `tests/e2e/cross-version-wire/` need upstream release tags (for example `v1.4.222`). They fail with `unknown revision` unless the tags are fetched with `git fetch upstream main --tags` (naming `main` keeps it from also pulling every upstream branch).

## Fork Workflow

This repository is a personal custom fork of `stablyai/orca`. Follow `AGENTS.md` for code rules; this section covers branches, pull requests, and upstream syncing.

### Branches

- `main`: Keep it identical to `upstream/main`. Never commit to it directly.
- `develop`: Holds the customizations. Code changes reach it only through merged PRs and upstream syncs. Only the fork's own docs (`README.md`, `CLAUDE.md`) may be committed to it directly.
- Custom work branches (`feat/*`, `fix/*`, etc.): Base them on `develop`. Open PRs against `develop` in this fork.
- Upstream contribution branches: Base them on `main`, never on `develop`. Open PRs against `stablyai/orca` `main`.
- `exp/lite`: The build the user actually runs: `develop` minus the features the user does not use. See Lite Branch.

### Pull Requests Into `develop`

- Always pass `--repo 1Dohyeon/orca` to `gh`. Without it, `gh` may target `stablyai/orca` because this repository is a fork.
- Title: a Conventional Commit subject, like upstream (`feat(scope): summary`). Pick the scope from the area the change lives in.
- Body: use the sections of `.github/pull_request_template.md`, but write only what can be stated in text. Leave out `Linked Issue`, `Visual Proof`, and the screenshot checklist item. State unverified items and failing checks as they are, and check a checklist item only when it is true.
- Merge only when the user asks. Use squash merge, with the subject `<PR title> (1Dohyeon/orca#<PR number>)`.
- Squash body: list each PR commit subject as `* <subject>`, separated by blank lines, without commit body details (they stay visible in the merged PR). Pass it with `--body-file` so GitHub does not fill in its default body:
  `gh pr merge <number> --repo 1Dohyeon/orca --squash --subject "<PR title> (1Dohyeon/orca#<number>)" --body-file <file>`
- Exception: upstream sync PRs (head `main` or `sync/upstream-*`, see Syncing Upstream) and PRs from `develop` into `exp/lite` (see Lite Branch) use a merge commit, never squash. Squashing keeps the source branch out of the target's history, so every later sync re-applies the same changes and conflicts again.
- Use the full `1Dohyeon/orca#<number>` reference. A bare `#<number>` links to the PR of whichever repository shows the commit, so it would point at an unrelated `stablyai/orca` PR there, and `1Dohyeon#<number>` is not linked by GitHub at all.
- After the merge, update the local `develop` with `git pull --ff-only origin develop`.

Upstream contributions follow the full upstream template instead, including a linked issue (required for outside contributors) and before/after visuals for UI changes.

### Syncing Upstream

`main` is the only branch that touches upstream. Upstream changes reach `develop` by merging `main` into it through a PR, so `develop` is never rewritten or force-pushed.

Precondition: the working tree is clean. Otherwise stop and report.

1. If the `upstream` remote is missing, add it: `git remote add upstream https://github.com/stablyai/orca`
2. `git fetch upstream main`
   - Always name `main`. A bare `git fetch upstream` pulls every upstream branch (over 17,000) and takes minutes, while only `main` is ever used.
3. Update `main`: `git push origin upstream/main:main`, then `git fetch origin main:main`
   - If the fast-forward is rejected, `main` has diverged from upstream. Do not force it; stop and report.
4. Open a PR from `main` into `develop`, titled `chore(sync): merge upstream main <short SHA> into develop`. Check for conflicts first with `git merge-tree --write-tree --name-only --no-messages origin/main origin/develop` (exit code 1 lists the conflicting files) and report them.
5. If the PR has no conflicts, go to step 8.
6. If it has conflicts, the user comments `/upstream-review` on that PR (without `@claude`). `.github/workflows/upstream-review.yml` shows each conflict's custom and upstream sides, proposes resolutions, and checks semantic conflicts against the incoming upstream commits. Do not use GitHub's "Resolve conflicts" button on this PR: it commits onto `main`.
7. Resolve on a branch instead:
   - Create `sync/upstream-<YYYYMMDD>` from `origin/develop` (same steps as any work branch) and run `git merge --no-ff origin/main`.
   - During a merge, `--ours` is `develop` and `--theirs` is `main`. Keep the custom `README.md` and `CLAUDE.md` (`git checkout --ours <file>`). In other files preserve both the upstream change and the custom intent; if the intent is unclear, stop and ask.
   - Verify: run `pnpm install` if `pnpm-lock.yaml` changed and `pnpm --dir mobile install --frozen-lockfile` if `mobile/pnpm-lock.yaml` changed, then `pnpm tc`.
   - Push, open a PR from this branch into `develop`, and close the `main` PR with a link to it. `/upstream-review` on the new PR checks the resolutions.
   - Report the number of upstream commits pulled in, conflicted files and how each was resolved, and the verification results.
8. Merge only when the user asks, with a merge commit:
   `gh pr merge <number> --repo 1Dohyeon/orca --merge --subject "<PR title> (1Dohyeon/orca#<number>)" --body ""`
9. After the merge, update the local `develop` with `git pull --ff-only origin develop` and reinstall dependencies:
   - Run `pnpm install` if `pnpm-lock.yaml` changed.
   - Run `pnpm --dir mobile install --frozen-lockfile` if `mobile/pnpm-lock.yaml` changed. `mobile` is excluded from the root pnpm workspace, so the root install leaves it on the old versions and `pnpm install:mac` / `pnpm install:win` fail while building the mobile web bundle.

### Lite Branch

`exp/lite` is `develop` plus commits that remove features the user does not use. It still takes every upstream and custom change through merges, so fixes and refactors in the features that remain arrive without porting them one by one.

- Commit only feature removals to `exp/lite`. Build custom features on `develop`; they reach `exp/lite` through merges.
- PRs into `exp/lite` follow Pull Requests Into `develop`. Base their branches on `exp/lite`.
- To update `exp/lite`, open a PR from `develop` into `exp/lite` and merge it with a merge commit. Never merge `exp/lite` into `develop`, and never base `develop` work or upstream contribution branches on it.
- When that merge conflicts on a file `exp/lite` deleted, keep it deleted (`git rm`). Also delete files the merge newly adds under removed paths.
- Resolve content conflicts where a removed feature was registered (routes, settings lists, imports, `package.json` scripts) by hand, keeping the removal. If the intent is unclear, stop and ask.
- A critical upstream fix that `develop` has not synced yet may be ported to `exp/lite` by hand, in a PR that links the upstream PR. When a later merge conflicts with that port, take the upstream version.
