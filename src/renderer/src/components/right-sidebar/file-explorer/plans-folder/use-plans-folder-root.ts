import { useEffect, useState } from 'react'
import { getFileExplorerOperationOwner } from '../navigation/file-explorer-operation-owner'

/** The repo's plans folder for a local git worktree; null otherwise or when the folder is missing. */
export function usePlansFolderRoot(
  worktreePath: string | null,
  activeWorktreeId: string | null,
  isGitRepo: boolean
): string | null {
  const [resolved, setResolved] = useState<{ worktreePath: string; plansRoot: string } | null>(null)
  useEffect(() => {
    if (
      !worktreePath ||
      !isGitRepo ||
      getFileExplorerOperationOwner(activeWorktreeId).kind !== 'local'
    ) {
      return
    }
    let cancelled = false
    window.api.plans.resolveRoot({ worktreePath }).then(
      (plansRoot) => {
        if (!cancelled) {
          setResolved(plansRoot ? { worktreePath, plansRoot } : null)
        }
      },
      // A failed lookup only means no plans node; the worktree tree is unaffected.
      () => {
        if (!cancelled) {
          setResolved(null)
        }
      }
    )
    return () => {
      cancelled = true
    }
  }, [worktreePath, activeWorktreeId, isGitRepo])
  return isGitRepo && resolved?.worktreePath === worktreePath ? resolved.plansRoot : null
}
