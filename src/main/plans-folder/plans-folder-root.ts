import { stat } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { plansFolderRelativePath } from '../../shared/plans-folder/plans-folder-path'
import { gitExecFileAsync } from '../git/command-runner/git-exec-file'
import { getRemoteUrl } from '../git/remotes/repo-remote-queries'
import { readGitCommonDir } from '../git/repositories/canonical-repo-key'

async function readMainCloneFolderName(worktreePath: string): Promise<string | null> {
  try {
    const { stdout } = await gitExecFileAsync(
      ['rev-parse', '--path-format=absolute', '--git-common-dir'],
      { cwd: worktreePath }
    )
    const commonDir = readGitCommonDir(stdout, worktreePath)
    return commonDir ? basename(dirname(commonDir)) : null
  } catch {
    return null
  }
}

/** Absolute plans folder for the worktree's repo, or null when it is not a git repo or the folder is missing. */
export async function resolvePlansFolderRoot(
  worktreePath: string,
  plansRoot: string
): Promise<string | null> {
  const mainCloneFolderName = await readMainCloneFolderName(worktreePath)
  if (!mainCloneFolderName) {
    return null
  }
  const originUrl = await getRemoteUrl(worktreePath)
  const root = join(plansRoot, plansFolderRelativePath(originUrl, mainCloneFolderName))
  try {
    return (await stat(root)).isDirectory() ? root : null
  } catch {
    return null
  }
}
