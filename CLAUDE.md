# CLAUDE.md

@AGENTS.md

## Language Rule

- Write everything that lands in this repository in English: code, comments, docs, commit messages, branch names, and PR text.
- Reply to the user in the user's configured language. Only repository artifacts follow the English rule.

## Test Runs

`pnpm check:changed` runs the full unit test suite (about 8 minutes) and truncates long output. Run it once and keep everything you need from that run.

- Redirect the full output to a file in the session scratchpad, then read the failure list from that file. Do not rerun the suite just to see which tests failed.
- Before blaming or clearing your change, run the failing test files on the base checkout (`develop`) with `pnpm test <files> --maxWorkers=2`. Report failures that also fail on the base as pre-existing, and the rest as possibly caused by the change.
- Tests under `tests/e2e/cross-version-wire/` need upstream release tags (for example `v1.4.222`). They fail with `unknown revision` unless the tags are fetched with `git fetch upstream --tags`.

## Fork Workflow

This repository is a personal custom fork of `stablyai/orca`. Follow `AGENTS.md` for code rules; this section covers branches, pull requests, and upstream syncing.

### Branches

- `main`: Keep it identical to `upstream/main`. Never commit to it directly.
- `develop`: Holds the customizations. Code changes reach it only through merged PRs and upstream syncs. Only the fork's own docs (`README.md`, `CLAUDE.md`) may be committed to it directly.
- Custom work branches (`feat/*`, `fix/*`, etc.): Base them on `develop`. Open PRs against `develop` in this fork.
- Upstream contribution branches: Base them on `main`, never on `develop`. Open PRs against `stablyai/orca` `main`.

### Pull Requests Into `develop`

- Always pass `--repo 1Dohyeon/orca` to `gh`. Without it, `gh` may target `stablyai/orca` because this repository is a fork.
- Title: a Conventional Commit subject, like upstream (`feat(scope): summary`). Pick the scope from the area the change lives in.
- Body: use the sections of `.github/pull_request_template.md`, but write only what can be stated in text. Leave out `Linked Issue`, `Visual Proof`, and the screenshot checklist item. State unverified items and failing checks as they are, and check a checklist item only when it is true.
- Merge only when the user asks. Use squash merge, with the subject `<PR title> (1Dohyeon/orca#<PR number>)`:
  `gh pr merge <number> --repo 1Dohyeon/orca --squash --subject "<PR title> (1Dohyeon/orca#<number>)"`
- Use the full `1Dohyeon/orca#<number>` reference. A bare `#<number>` links to the PR of whichever repository shows the commit, so it would point at an unrelated `stablyai/orca` PR there, and `1Dohyeon#<number>` is not linked by GitHub at all.
- After the merge, update the local `develop` with `git pull --ff-only origin develop`.

Upstream contributions follow the full upstream template instead, including a linked issue (required for outside contributors) and before/after visuals for UI changes.

### Syncing Upstream

Precondition: the current branch is `develop` and the working tree is clean. Otherwise stop and report.

1. If the `upstream` remote is missing, add it: `git remote add upstream https://github.com/stablyai/orca`
2. `git fetch upstream`
3. Update `main`: `git push origin upstream/main:main`, then `git fetch origin main:main`
   - If the fast-forward is rejected, `main` has diverged from upstream. Do not force it; stop and report.
4. On `develop`, run `git rebase main`.
5. Resolve conflicts (during a rebase, `--ours` is `main` and `--theirs` is the custom commit).
   - `README.md`, `CLAUDE.md`: Keep the custom version (`git checkout --theirs <file>`).
   - Other files: Preserve both the upstream change and the custom intent. If the intent is unclear, stop and ask.
6. Verify: run `pnpm install` if the lockfile changed, then `pnpm tc`.
7. Report the number of upstream commits pulled in, conflicted files and how each was resolved, and the verification results. Run `git push --force-with-lease origin develop` only after the user approves.
