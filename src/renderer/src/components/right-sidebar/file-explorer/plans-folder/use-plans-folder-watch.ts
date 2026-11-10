import { useEffect, useEffectEvent } from 'react'
import { dirname } from '@/lib/path'
import {
  isPathInsideOrEqual,
  normalizeRuntimePathForComparison
} from '../../../../../../shared/cross-platform-path'
import type { FsChangeEvent } from '../../../../../../shared/file-watch/filesystem-change-event'

function changedDirs(events: readonly FsChangeEvent[]): string[] | 'all' {
  const dirs: string[] = []
  for (const event of events) {
    if (event.kind === 'overflow') {
      return 'all'
    }
    // Content edits leave the listing unchanged.
    if (event.kind === 'update') {
      continue
    }
    dirs.push(dirname(event.absolutePath))
    if (event.oldAbsolutePath) {
      dirs.push(dirname(event.oldAbsolutePath))
    }
  }
  return dirs
}

/** Rereads expanded plans folders on disk changes; the worktree watcher drops events from other roots. */
export function usePlansFolderWatch(
  plansRoot: string | null,
  expanded: ReadonlySet<string>,
  refreshDir: (dirPath: string) => Promise<void>
): void {
  const refreshChangedDirs = useEffectEvent((root: string, changed: string[] | 'all') => {
    const changedKeys =
      changed === 'all' ? null : new Set(changed.map(normalizeRuntimePathForComparison))
    for (const dirPath of expanded) {
      if (
        isPathInsideOrEqual(root, dirPath) &&
        (changedKeys === null || changedKeys.has(normalizeRuntimePathForComparison(dirPath)))
      ) {
        void refreshDir(dirPath)
      }
    }
  })

  useEffect(() => {
    if (!plansRoot) {
      return
    }
    const rootKey = normalizeRuntimePathForComparison(plansRoot)
    const unsubscribe = window.api.fs.onFsChanged((payload) => {
      if (normalizeRuntimePathForComparison(payload.worktreePath) !== rootKey) {
        return
      }
      refreshChangedDirs(plansRoot, changedDirs(payload.events))
    })
    // A failed watch only loses live updates; manual refresh still rereads the folder.
    window.api.fs.watchWorktree({ worktreePath: plansRoot }).catch(() => {})
    return () => {
      unsubscribe()
      void window.api.fs.unwatchWorktree({ worktreePath: plansRoot })
    }
  }, [plansRoot])
}
