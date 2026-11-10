import {
  relativePathInsideRoot,
  splitPathSegments
} from '../../../../../../shared/cross-platform-path'
import type { DirCache, FileExplorerOperationOwner, TreeNode } from '../tree/file-explorer-types'

/** Row depth under the plans node (the node itself is 0), or null outside the plans folder. */
export function plansFolderRowDepth(plansRoot: string, path: string): number | null {
  const relative = relativePathInsideRoot(plansRoot, path)
  return relative === null ? null : splitPathSegments(relative).length
}

/** The plans node itself: renaming or deleting it would move or trash every plan of the repo. */
export function isPlansFolderRoot(node: Pick<TreeNode, 'plansFolder' | 'depth'>): boolean {
  return node.plansFolder === true && node.depth === 0
}

export function createPlansFolderNode(
  plansRoot: string,
  operationOwner: FileExplorerOperationOwner | undefined
): TreeNode {
  return {
    name: 'plans',
    path: plansRoot,
    // Absolute so Git status, ignore checks, and tabs never confuse it with a worktree path.
    relativePath: plansRoot,
    isDirectory: true,
    depth: 0,
    outsideProject: true,
    plansFolder: true,
    ...(operationOwner ? { operationOwner } : {})
  }
}

function markPlansFolderListing(cache: DirCache, plansRoot: string): DirCache {
  return {
    ...cache,
    plansFolder: true,
    children: cache.children.map((child) => ({
      ...child,
      relativePath: child.path,
      // Listings read outside the worktree get depths measured from the worktree, which are wrong here.
      depth: plansFolderRowDepth(plansRoot, child.path) ?? child.depth,
      outsideProject: true,
      plansFolder: true
    }))
  }
}

/** The tree as shown: the plans node first under the worktree root, and plans listings marked. */
export function withPlansFolderNode(
  dirCache: Record<string, DirCache>,
  worktreePath: string,
  plansRoot: string
): Record<string, DirCache> {
  const root = dirCache[worktreePath]
  if (!root) {
    return dirCache
  }
  const next: Record<string, DirCache> = {}
  for (const [dirPath, cache] of Object.entries(dirCache)) {
    next[dirPath] =
      plansFolderRowDepth(plansRoot, dirPath) === null
        ? cache
        : markPlansFolderListing(cache, plansRoot)
  }
  next[worktreePath] = {
    ...root,
    children: [
      createPlansFolderNode(plansRoot, root.operationOwner),
      ...root.children.filter((child) => child.path !== plansRoot)
    ]
  }
  return next
}
