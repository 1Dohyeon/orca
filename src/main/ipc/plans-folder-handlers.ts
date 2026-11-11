import { ipcMain } from 'electron'
import type { Store } from '../persistence/loading-store/store'
import { resolvePlansFolderRoot } from '../plans-folder/plans-folder-root'
import { plansHomeRoot } from '../plans-folder/plans-home-root'
import { resolveAuthorizedPath } from './filesystem/access/filesystem-auth'

export function registerPlansFolderHandlers(store: Store): void {
  ipcMain.handle(
    'plans:resolveRoot',
    async (_event, args: { worktreePath: string }): Promise<string | null> => {
      if (typeof args?.worktreePath !== 'string') {
        return null
      }
      const worktreePath = await resolveAuthorizedPath(args.worktreePath, store)
      return resolvePlansFolderRoot(worktreePath, plansHomeRoot(store.getSettings()))
    }
  )
}
