import { GENERAL_SETTING_ANCHORS } from './general-setting-anchors'
import React, { useId } from 'react'
import type { GlobalSettings } from '../../../../../shared/global-settings-types'
import { Label } from '../../ui/label'
import { SearchableSetting } from '../section-layout/SearchableSetting'
import { FolderPathInput } from './FolderPathInput'
import { useTranslate } from '@/i18n/use-translate'

type PlansFolderSettingProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function PlansFolderSetting({
  settings,
  updateSettings
}: PlansFolderSettingProps): React.JSX.Element {
  const t = useTranslate()
  const inputId = useId()
  const title = t('settings.general.plansFolder.title', 'Plans folder')
  const description = t(
    'settings.general.plansFolder.description',
    'Root folder that holds plans for each repository. Leave empty to use ~/plans.'
  )

  return (
    <SearchableSetting
      id={GENERAL_SETTING_ANCHORS.plansFolder}
      title={title}
      description={description}
      keywords={['plans', 'folder', 'path', 'explorer']}
      className="space-y-2 py-3"
    >
      <Label htmlFor={inputId}>{title}</Label>
      <FolderPathInput
        id={inputId}
        value={settings.plansFolderPath ?? ''}
        placeholder={t('settings.general.plansFolder.placeholder', '~/plans')}
        normalize={(draft) => draft.trim()}
        onCommit={(next) => updateSettings({ plansFolderPath: next })}
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </SearchableSetting>
  )
}
