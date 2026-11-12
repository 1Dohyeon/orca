import React, { useCallback, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { translate } from '@/i18n/i18n'
import { useTranslate } from '@/i18n/use-translate'
import {
  buildDefaultGitHistoryColorMap,
  buildGitHistoryViewModels
} from '../../../../../../shared/git/history/git-history-graph'
import type { GitHistoryItem } from '../../../../../../shared/git/history/git-history-types'
import type { GitBranchChangeEntry } from '../../../../../../shared/git/diff/git-diff-compare-types'
import type { BranchCommitsState } from '../sync/use-branch-commits'
import { GitHistoryRow } from '../sync/git-history-row'
import {
  GitHistoryCommitFiles,
  type GitHistoryCommitFilesState
} from '../sync/git-history-commit-files'
import {
  GitHistoryCommitContextMenu,
  type GitHistoryCommitAction
} from '../sync/git-history-commit-context-menu'
import { filterSourceControlPathEntries, type SourceControlFileFilterState } from './file-filter'
import type { SourceControlRowOpenEvent } from './split-open'

export type BranchCommitListActions = {
  loadCommitFiles: (item: GitHistoryItem) => Promise<GitBranchChangeEntry[]>
  openCommitFile: (
    item: GitHistoryItem,
    entry: GitBranchChangeEntry,
    event?: SourceControlRowOpenEvent
  ) => void
  openCommit: (item: GitHistoryItem) => void
  onCommitAction: (action: GitHistoryCommitAction, item: GitHistoryItem) => void
}

function StatusLine({
  tone = 'muted',
  children
}: {
  tone?: 'muted' | 'error'
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div
      className={
        tone === 'error'
          ? 'px-6 py-2 text-[11px] text-destructive'
          : 'flex items-center gap-2 px-6 py-2 text-[11px] text-muted-foreground'
      }
    >
      {children}
    </div>
  )
}

/** Commits on the branch, each expandable to the files that commit changed. */
export function BranchCommitList({
  state,
  fileFilterState,
  actions
}: {
  state: BranchCommitsState
  fileFilterState: SourceControlFileFilterState
  actions: BranchCommitListActions
}): React.JSX.Element {
  const t = useTranslate()
  const result = state.status === 'ready' ? state.result : null
  const viewModels = useMemo(
    () =>
      result
        ? buildGitHistoryViewModels(
            result.items,
            buildDefaultGitHistoryColorMap(result),
            result.currentRef,
            result.remoteRef,
            result.baseRef,
            false,
            false,
            result.mergeBase
          )
        : [],
    [result]
  )
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  // Commit contents never change for an OID, so loaded files stay valid across refreshes.
  const [filesByCommit, setFilesByCommit] = useState<Record<string, GitHistoryCommitFilesState>>({})
  const { loadCommitFiles } = actions

  const toggleExpand = useCallback(
    (item: GitHistoryItem): void => {
      const id = item.id
      const willExpand = !expanded.has(id)
      setExpanded((prev) => {
        const next = new Set(prev)
        if (willExpand) {
          next.add(id)
        } else {
          next.delete(id)
        }
        return next
      })
      const current = filesByCommit[id]
      if (!willExpand || (current && current.status !== 'error')) {
        return
      }
      setFilesByCommit((prev) => ({ ...prev, [id]: { status: 'loading' } }))
      loadCommitFiles(item)
        .then((entries) => {
          setFilesByCommit((prev) => ({ ...prev, [id]: { status: 'ready', entries } }))
        })
        .catch((error: unknown) => {
          setFilesByCommit((prev) => ({
            ...prev,
            [id]: {
              status: 'error',
              error:
                error instanceof Error
                  ? error.message
                  : translate(
                      'auto.components.right.sidebar.GitHistoryPanel.6d1e0a7c3b',
                      'Failed to load commit files'
                    )
            }
          }))
        })
    },
    [expanded, filesByCommit, loadCommitFiles]
  )

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <StatusLine>
        <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden="true" />
        <span>
          {t(
            'auto.components.right.sidebar.SourceControl.branchCommits.loading',
            'Loading commits'
          )}
        </span>
      </StatusLine>
    )
  }
  if (state.status === 'error') {
    return <StatusLine tone="error">{state.error}</StatusLine>
  }
  if (viewModels.length === 0) {
    return (
      <StatusLine>
        {t(
          'auto.components.right.sidebar.SourceControl.branchCommits.empty',
          'No commits on this branch'
        )}
      </StatusLine>
    )
  }

  return (
    <div>
      {viewModels.map((viewModel) => {
        const item = viewModel.historyItem
        const isExpanded = expanded.has(item.id)
        const filesState = filesByCommit[item.id] ?? { status: 'loading' }
        return (
          <div key={item.id}>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <GitHistoryRow
                  viewModel={viewModel}
                  expanded={isExpanded}
                  preserveRefIds={result?.baseRef ? [result.baseRef.id] : undefined}
                  onToggleExpand={toggleExpand}
                />
              </ContextMenuTrigger>
              <GitHistoryCommitContextMenu item={item} onAction={actions.onCommitAction} />
            </ContextMenu>
            {isExpanded && (
              <GitHistoryCommitFiles
                state={
                  filesState.status === 'ready'
                    ? {
                        status: 'ready',
                        entries: filterSourceControlPathEntries(filesState.entries, fileFilterState)
                      }
                    : filesState
                }
                author={item.author}
                timestamp={item.timestamp}
                onOpenFile={(entry, event) => actions.openCommitFile(item, entry, event)}
                onOpenAll={() => actions.openCommit(item)}
              />
            )}
          </div>
        )
      })}
      {result?.hasMore && (
        <StatusLine>
          {t(
            'auto.components.right.sidebar.SourceControl.branchCommits.more',
            'More commits not shown'
          )}
        </StatusLine>
      )}
    </div>
  )
}
