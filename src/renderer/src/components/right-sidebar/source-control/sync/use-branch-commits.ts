import { useEffect, useRef, useState } from 'react'
import { requireGitOwnerTarget } from './worktree-git-owner-target'
import type { RuntimeClientTarget } from '../../../../../../shared/runtime-client-target'
import { sourceControlConnectionId, useSourceControlScope } from '../panel/worktree-scope'
import { getRuntimeGitHistory } from '@/runtime/source-control/git/runtime-git-status-client'
import {
  GIT_HISTORY_MAX_LIMIT,
  type GitHistoryResult
} from '../../../../../../shared/git/history/git-history-types'

export type BranchCommitsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; result: GitHistoryResult }
  | { status: 'error'; error: string }

type LoadedBranchCommits = {
  worktreeId: string
  baseRef: string
  state: BranchCommitsState
}

const IDLE: BranchCommitsState = { status: 'idle' }
const LOADING: BranchCommitsState = { status: 'loading' }

/** Commits on HEAD that the compare base lacks; runs Git only while `enabled`. */
export function useBranchCommits({
  enabled,
  activeRepoTarget,
  activeWorktreeId,
  worktreePath,
  compareBaseRef,
  headOid,
  baseOid
}: {
  enabled: boolean
  activeRepoTarget: RuntimeClientTarget | null
  activeWorktreeId: string | null
  worktreePath: string | null
  compareBaseRef: string | null
  headOid: string | null
  baseOid: string | null
}): BranchCommitsState {
  const scope = useSourceControlScope()
  const [loaded, setLoaded] = useState<LoadedBranchCommits | null>(null)
  const requestSeqRef = useRef(0)
  // Use stable owner identity so target-object replacement cannot refetch.
  const ownerHostKey =
    activeRepoTarget?.kind === 'environment' ? activeRepoTarget.environmentId : ''
  const latestRef = useRef({ activeRepoTarget, scope })
  useEffect(() => {
    latestRef.current = { activeRepoTarget, scope }
  }, [activeRepoTarget, scope])

  useEffect(() => {
    const requestId = requestSeqRef.current + 1
    requestSeqRef.current = requestId
    if (!enabled || !activeWorktreeId || !worktreePath || !compareBaseRef) {
      return
    }
    const worktreeId = activeWorktreeId
    const baseRef = compareBaseRef
    const load = async (): Promise<void> => {
      const { activeRepoTarget: target, scope: currentScope } = latestRef.current
      try {
        const result = await getRuntimeGitHistory(
          {
            // Read history on the repo owner, which may differ from the focused host.
            target: requireGitOwnerTarget(target),
            worktreeId,
            worktreePath,
            connectionId: sourceControlConnectionId(currentScope, worktreeId)
          },
          { branchOnly: true, baseRef, limit: GIT_HISTORY_MAX_LIMIT }
        )
        if (requestSeqRef.current !== requestId) {
          return
        }
        setLoaded({ worktreeId, baseRef, state: { status: 'ready', result } })
      } catch (error) {
        if (requestSeqRef.current !== requestId) {
          return
        }
        setLoaded({
          worktreeId,
          baseRef,
          state: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to load commits'
          }
        })
      }
    }
    void load()
    // Tip OIDs come from the polled branch compare, so commits follow new commits and base moves.
  }, [enabled, activeWorktreeId, worktreePath, compareBaseRef, headOid, baseOid, ownerHostKey])

  if (!enabled || !activeWorktreeId || !worktreePath || !compareBaseRef) {
    return IDLE
  }
  // Keep the previous list while a refresh for the same worktree and base is in flight.
  if (loaded?.worktreeId === activeWorktreeId && loaded.baseRef === compareBaseRef) {
    return loaded.state
  }
  return LOADING
}
