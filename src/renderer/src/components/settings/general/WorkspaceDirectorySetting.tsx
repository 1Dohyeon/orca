import { GENERAL_SETTING_ANCHORS } from './general-setting-anchors'
import React, { useId, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import type { GlobalSettings } from '../../../../../shared/global-settings-types'
import {
  getEffectiveHostSetting,
  getHostSettingOverride,
  setHostSettingOverride,
  clearHostSettingOverride
} from '../../../../../shared/host-setting-overrides'
import { LOCAL_EXECUTION_HOST_ID } from '../../../../../shared/execution-host'
import { normalizeWorkspaceDirInput } from '../../../../../shared/worktree/workspace-dir-input'
import { isWindowsUserAgent } from '@/app-shell/platform/user-agent-platform'
import { Button } from '../../ui/button'
import { Label } from '../../ui/label'
import { HostCombobox } from '../../host-picker/HostCombobox'
import { SearchableSetting } from '../section-layout/SearchableSetting'
import { useSidebarHostScopeOptions } from '../../sidebar/worktree-list/controls/use-sidebar-host-scope-options'
import { FolderPathInput } from './FolderPathInput'
import {
  buildHostScopeChoices,
  CLIENT_DEFAULT_SCOPE,
  isHostScope,
  type HostSettingScope
} from '../workspaces/directory/host-scoped-setting-scope'
import { useTranslate } from '@/i18n/use-translate'

type WorkspaceDirectorySettingProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function WorkspaceDirectorySetting({
  settings,
  updateSettings
}: WorkspaceDirectorySettingProps): React.JSX.Element {
  const t = useTranslate()
  const { hostOptions } = useSidebarHostScopeOptions()
  const [scope, setScope] = useState<HostSettingScope>(CLIENT_DEFAULT_SCOPE)
  const inputId = useId()

  const clientDefaultLabel = t(
    'auto.components.settings.WorkspaceDirectorySetting.1a2b3c4d5e',
    'Client default'
  )
  const choices = buildHostScopeChoices(hostOptions, clientDefaultLabel)
  // If a selected host disappears, return to client default rather than edit a stale host.
  const activeScope = choices.some((c) => c.scope === scope) ? scope : CLIENT_DEFAULT_SCOPE
  const editingHost = isHostScope(activeScope)

  const hostOverride = editingHost
    ? getHostSettingOverride(settings, activeScope, 'defaultWorktreeLocation')
    : undefined
  const hasOverride = editingHost && hostOverride !== undefined

  const value = editingHost
    ? getEffectiveHostSetting(
        settings,
        activeScope,
        'defaultWorktreeLocation',
        settings.workspaceDir
      )
    : settings.workspaceDir

  const writeValue = (next: string): void => {
    if (!editingHost) {
      updateSettings({ workspaceDir: next })
      return
    }
    updateSettings({
      hostSettingOverrides: setHostSettingOverride(
        settings,
        activeScope,
        'defaultWorktreeLocation',
        next
      )
    })
  }

  const resetOverride = (): void => {
    if (!editingHost) {
      return
    }
    updateSettings({
      hostSettingOverrides: clearHostSettingOverride(
        settings,
        activeScope,
        'defaultWorktreeLocation'
      )
    })
  }

  // Match sidebar multi-host gating; local-only users need no scope picker.
  const showScopePicker = hostOptions.some((host) => host.id !== LOCAL_EXECUTION_HOST_ID)

  return (
    <SearchableSetting
      id={GENERAL_SETTING_ANCHORS.folder}
      title={t(
        'auto.components.settings.GeneralWorkspaceSettingsSection.9d0ef6a2a6',
        'Workspace directory'
      )}
      description={t(
        'auto.components.settings.GeneralWorkspaceSettingsSection.a246f5ce6f',
        'Root directory where workspace folders are created.'
      )}
      keywords={['workspace', 'folder', 'path', 'worktree', 'host', 'override']}
      className="space-y-2 py-3"
    >
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={inputId}>
          {t(
            'auto.components.settings.GeneralWorkspaceSettingsSection.9d0ef6a2a6',
            'Workspace directory'
          )}
        </Label>
        {showScopePicker && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {t('auto.components.settings.WorkspaceDirectorySetting.2b3c4d5e6f', 'Apply to')}
            </span>
            <HostCombobox
              value={activeScope}
              onChange={(next) => {
                const choice = choices.find((candidate) => candidate.scope === next)
                if (choice) {
                  setScope(choice.scope)
                }
              }}
              options={choices.map((choice) => ({ id: choice.scope, label: choice.label }))}
              size="xs"
              className="w-44"
            />
          </div>
        )}
      </div>
      {/* settings:set creates directories; per-keystroke commits would create every typed prefix. */}
      <FolderPathInput
        id={inputId}
        value={value}
        normalize={(draft) => normalizeWorkspaceDirInput(draft, isWindowsUserAgent())}
        onCommit={writeValue}
      />
      {editingHost && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {hasOverride
              ? t(
                  'auto.components.settings.WorkspaceDirectorySetting.3c4d5e6f7a',
                  'Overrides client default'
                )
              : t(
                  'auto.components.settings.WorkspaceDirectorySetting.4d5e6f7a8b',
                  'Inherits the client default'
                )}
          </p>
          {hasOverride && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={resetOverride}
            >
              <RotateCcw className="size-3.5" />
              {t('auto.components.settings.WorkspaceDirectorySetting.5e6f7a8b9c', 'Reset')}
            </Button>
          )}
        </div>
      )}
      {/* Describe only the client-default resolver; host creation semantics differ. */}
      {!editingHost && (
        <p className="text-xs text-muted-foreground">
          {t(
            'auto.components.settings.WorkspaceDirectorySetting.6f7a8b9cad',
            'Use a relative path (e.g. .orca/worktrees) for a per-project location, or an absolute path for one shared folder.'
          )}
        </p>
      )}
    </SearchableSetting>
  )
}
