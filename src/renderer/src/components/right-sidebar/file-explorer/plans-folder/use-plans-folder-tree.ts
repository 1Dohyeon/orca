import { useCallback, useMemo } from 'react'
import type { useFileExplorerTree } from '../tree/useFileExplorerTree'
import { plansFolderRowDepth, withPlansFolderNode } from './plans-folder-node'

type FileExplorerTree = ReturnType<typeof useFileExplorerTree>

/** Shows the plans folder in the worktree tree without storing it in the worktree's cache. */
export function usePlansFolderTree(
  tree: FileExplorerTree,
  worktreePath: string | null,
  plansRoot: string | null
): FileExplorerTree {
  const { dirCache, loadDir: loadTreeDir, refreshDir: refreshTreeDir } = tree
  const shownDirCache = useMemo(
    () =>
      worktreePath && plansRoot ? withPlansFolderNode(dirCache, worktreePath, plansRoot) : dirCache,
    [dirCache, worktreePath, plansRoot]
  )
  // Worktree-relative depth math yields -1 for a shorter outside path, which loadDir treats as the root.
  const loadDir = useCallback<FileExplorerTree['loadDir']>(
    (dirPath, depth, options) =>
      loadTreeDir(
        dirPath,
        (plansRoot ? plansFolderRowDepth(plansRoot, dirPath) : null) ?? depth,
        options
      ),
    [loadTreeDir, plansRoot]
  )
  const refreshDir = useCallback<FileExplorerTree['refreshDir']>(
    async (dirPath, options) => {
      const plansDepth = plansRoot ? plansFolderRowDepth(plansRoot, dirPath) : null
      if (plansDepth === null) {
        return refreshTreeDir(dirPath, options)
      }
      await loadTreeDir(dirPath, plansDepth, { force: true, wakeWslDistro: options?.wakeWslDistro })
    },
    [loadTreeDir, plansRoot, refreshTreeDir]
  )
  if (!worktreePath || !plansRoot) {
    return tree
  }
  return {
    ...tree,
    dirCache: shownDirCache,
    rootCache: shownDirCache[worktreePath],
    loadDir,
    refreshDir
  }
}
