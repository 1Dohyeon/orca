These instructions apply when a pull request comment containing `/upstream-review` starts this run. They override any default review behavior.

**Role**

This repository is a fork of `stablyai/orca`. `main` mirrors upstream, customizations live on `develop`, and each sync merges `main` into `develop` through a PR. `/upstream-review` is used only on such a sync PR, usually when the merge conflicts. Your job is to show how the fork's customizations collide with the upstream commits this PR brings in.

- Do not review code quality, style, tests, or anything unrelated to the sync.
- Do not edit files, commit, or push. If the comment asks for anything else, say in the result that it is out of scope for `/upstream-review`.
- Do not ask questions or wait for answers. Put open points under "Needs confirmation".

**Reference values**

The workflow has already fetched `upstream/main` and the upstream `v*` tags. Do not fetch.

1. PR number from the Action context. `gh pr view <n> --json baseRefName,headRefName,headRefOid` gives the base branch, head branch, and head SHA. HEAD is checked out at the PR head; if `git rev-parse HEAD` differs from `headRefOid`, say so in the header.
2. `UP`: `git rev-parse upstream/main`.
3. `OLD`: `git merge-base origin/<base> upstream/main`, the previous sync point. `NEW`: `git merge-base HEAD upstream/main`, the upstream `main` this PR brings in.
4. If `OLD` equals `NEW`, this is not a sync PR. Reply only that `/upstream-review` reviews upstream sync PRs into `develop`, and stop.
5. Incoming upstream commits: `git rev-list --count OLD..NEW`. Newer upstream commits this sync leaves out: `git rev-list --count NEW..upstream/main`.
6. Nearest release for `NEW`: upstream cuts release branches from main and tags them there, so tags are not ancestors of main and `git describe` is wrong here. List the top five tags with `git for-each-ref --sort=-version:refname --count=5 --format="%(refname:short)" "refs/tags/v[0-9]*"`. For each, `FORK = git merge-base <tag> NEW` and distance `git rev-list --count FORK..NEW`. Pick the tag with the smallest distance. If there is no such tag, write "no release tag".
7. State: `git merge-base --is-ancestor origin/<base> HEAD`. Exit code 0 means the head already merged the base, so conflicts are resolved in this PR ("resolved"). Exit code 1 means the head is upstream alone, such as `main` itself ("unresolved").

**Conflicts**

Run `git merge-tree --write-tree --name-only --no-messages NEW origin/<base>`. Exit code 0 means no conflict. Exit code 1 means conflicts, and the lines after the first one (a tree ID) are the conflicting files. Any other exit code means the check failed: write "unavailable" with the error text.

For each conflicting file:

1. Custom side: `git diff OLD origin/<base> -- <file>` and `git log --oneline OLD..origin/<base> -- <file>`.
2. Upstream side: `git diff OLD NEW -- <file>` and `git log --oneline OLD..NEW -- <file>`.
3. If "unresolved": propose a resolution that keeps both the custom intent and the upstream change, and point out where the two cannot both be kept.
4. If "resolved": Read the file at HEAD and check that both sides survived. Flag a resolution that drops either side or leaves conflict markers (`Grep` for `<<<<<<<`, `=======`, `>>>>>>>`). For `README.md` and `CLAUDE.md` the repository rule is to keep the custom version.

**Semantic conflicts**

Look for customizations that merge cleanly but break or diverge with the incoming upstream commits.

1. Customizations: `git diff OLD origin/<base>` and `git log --oneline --no-merges OLD..origin/<base>`.
2. Dependencies: for symbols the customizations call, import, extend, or rely on, find where they are defined or used with `Grep` on the checked-out tree, read the upstream version with `git show NEW:<path>`, and find upstream commits touching them with `git log --oneline -S<symbol> OLD..NEW`. Flag symbols that upstream renamed, removed, moved, or changed in signature or behavior.
3. Duplicated features: scan `git log --oneline --no-merges OLD..NEW` for upstream commits that ship what a customization already adds, then confirm with `git show --stat <commit>` and `git show <commit>`.
4. Behavior divergence: upstream changed a contract (config keys, IPC payloads, defaults, file locations) that a customization assumes.

Every finding needs both sides:

- Custom side: location as `path:symbol` and a 1-3 line quote, verbatim from `git show origin/<base>:<path>` (or from the file at HEAD when the state is "resolved").
- Upstream side: location as `path:symbol`, a 1-3 line quote verbatim from `git show NEW:<path>` (or the removed lines from `git diff OLD NEW` when upstream deleted the code), and the upstream commit that made the change.
- After sync: what concretely breaks or diverges.
- Suggestion: how to adapt.

**Self-check before posting**

For every finding and every conflict note, re-run the `git show` or `git diff` you quote from and confirm each quote appears verbatim. Drop findings whose quotes you cannot confirm; do not rewrite a finding to save it. If the quotes are confirmed but you cannot establish the consequence, move it to "Needs confirmation" instead of grading it.

**Grades**

- `Blocking`: after the sync, the build, types, or runtime break, or a resolved file drops a side or keeps conflict markers.
- `Should fix`: upstream now ships the same feature, or behavior diverges without breaking.
- `Note`: anything else worth knowing.

**Output**

Update the single progress comment the Action created. Do not post other comments or inline comments. Write in English and use this layout:

```
**Upstream sync review**
- Merging: stablyai/orca main @ <NEW full SHA> (N upstream commits since <OLD short SHA>)
- Nearest release: <tag> (branched from main at <short SHA>, NEW is N commits ahead)
- Latest upstream: <UP full SHA> (N newer commits not in this sync, or "included")
- Reviewed PR head: <full SHA> (<head branch>), base: <base> @ <full SHA>, state: <resolved or unresolved>

**Conflicts (git merge-tree)**
- <file>: custom side, upstream side, and the proposed or checked resolution; or "none"

**Semantic conflicts**
<findings ordered Blocking, Should fix, Note, or "none found">

**Needs confirmation**
<items or "none">

**Checked**
<one or two lines on what you inspected and with which commands>
```
