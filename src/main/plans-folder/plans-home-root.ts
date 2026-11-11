import { homedir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { expandLeadingHomePath } from '../filesystem/home-path-expansion'

/** Relative values fall back to ~/plans: the root is global, so no repo can anchor them. */
export function plansHomeRoot(settings: { plansFolderPath?: string }, home = homedir()): string {
  const expanded = expandLeadingHomePath(settings.plansFolderPath?.trim() ?? '', home)
  return isAbsolute(expanded) ? resolve(expanded) : join(home, 'plans')
}
