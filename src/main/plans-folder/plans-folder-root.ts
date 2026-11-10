import { stat } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { plansFolderRelativePath } from '../../shared/plans-folder/plans-folder-path'
import { readGitCommonDir } from '../git/canonical-repo-key'
import { getRemoteUrl } from '../git/repo'
import { gitExecFileAsync } from '../git/runner'
import { plansHomeRoot } from './plans-home-root'

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
export async function resolvePlansFolderRoot(worktreePath: string): Promise<string | null> {
  const mainCloneFolderName = await readMainCloneFolderName(worktreePath)
  if (!mainCloneFolderName) {
    return null
  }
  const originUrl = await getRemoteUrl(worktreePath)
  const root = join(plansHomeRoot(), plansFolderRelativePath(originUrl, mainCloneFolderName))
  try {
    return (await stat(root)).isDirectory() ? root : null
  } catch {
    return null
  }
}
