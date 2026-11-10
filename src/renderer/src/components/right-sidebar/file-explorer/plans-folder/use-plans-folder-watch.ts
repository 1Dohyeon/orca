import { useEffect, useRef } from 'react'
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
  const expandedRef = useRef(expanded)
  expandedRef.current = expanded
  const refreshDirRef = useRef(refreshDir)
  refreshDirRef.current = refreshDir

  useEffect(() => {
    if (!plansRoot) {
      return
    }
    const rootKey = normalizeRuntimePathForComparison(plansRoot)
    const unsubscribe = window.api.fs.onFsChanged((payload) => {
      if (normalizeRuntimePathForComparison(payload.worktreePath) !== rootKey) {
        return
      }
      const changed = changedDirs(payload.events)
      const changedKeys =
        changed === 'all' ? null : new Set(changed.map(normalizeRuntimePathForComparison))
      for (const dirPath of expandedRef.current) {
        if (
          isPathInsideOrEqual(plansRoot, dirPath) &&
          (changedKeys === null || changedKeys.has(normalizeRuntimePathForComparison(dirPath)))
        ) {
          void refreshDirRef.current(dirPath)
        }
      }
    })
    // A failed watch only loses live updates; manual refresh still rereads the folder.
    window.api.fs.watchWorktree({ worktreePath: plansRoot }).catch(() => {})
    return () => {
      unsubscribe()
      void window.api.fs.unwatchWorktree({ worktreePath: plansRoot })
    }
  }, [plansRoot])
}
