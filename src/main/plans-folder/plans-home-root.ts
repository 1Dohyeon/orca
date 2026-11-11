import { homedir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { isWindowsAbsolutePathLike } from '../../shared/cross-platform-path'
import { expandLeadingHomePath } from '../filesystem/home-path-expansion'

/** Relative values fall back to ~/plans: the root is global, so no repo can anchor them. */
export function plansHomeRoot(settings: { plansFolderPath?: string }, home = homedir()): string {
  const expanded = expandLeadingHomePath(settings.plansFolderPath?.trim() ?? '', home)
  // Drive-less Windows roots like \plans would resolve against the launch drive.
  const isRooted =
    process.platform === 'win32' ? isWindowsAbsolutePathLike(expanded) : isAbsolute(expanded)
  return isRooted ? resolve(expanded) : join(home, 'plans')
}
