import React, { useEffect, useRef, useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { isImeCompositionKeyDown } from '@/lib/text-input/ime/ime-composition-keyboard-event'
import { useTranslate } from '@/i18n/use-translate'

type FolderPathInputProps = {
  id: string
  value: string
  placeholder?: string
  normalize: (draft: string) => string
  onCommit: (next: string) => void
}

/** Folder path field that saves only on Enter, blur, or Browse, never per keystroke. */
export function FolderPathInput({
  id,
  value,
  placeholder,
  normalize,
  onCommit
}: FolderPathInputProps): React.JSX.Element {
  const t = useTranslate()
  const [draftValue, setDraftValue] = useState(value)
  const draftValueRef = useRef(value)
  const skipNextBlurCommitRef = useRef(false)

  useEffect(() => {
    setDraftValue(value)
    draftValueRef.current = value
  }, [value])

  const setDraft = (next: string): void => {
    draftValueRef.current = next
    setDraftValue(next)
  }

  const commitDraftValue = (): void => {
    // Show the value main will save, so a padded re-save of the saved path writes nothing.
    const next = normalize(draftValueRef.current)
    setDraft(next)
    if (next === value) {
      return
    }
    onCommit(next)
  }

  const handleBlur = (): void => {
    if (skipNextBlurCommitRef.current) {
      skipNextBlurCommitRef.current = false
      return
    }
    commitDraftValue()
  }

  const resetDraftValue = (): void => {
    setDraft(value)
  }

  const handleBrowse = async (): Promise<void> => {
    try {
      const path = await window.api.repos.pickFolder()
      if (path) {
        setDraft(path)
        onCommit(path)
        return
      }
      resetDraftValue()
    } finally {
      skipNextBlurCommitRef.current = false
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        value={draftValue}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value)
        }}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          // IME candidate-confirming Enter must not commit; wait for a noncomposition Enter.
          if (isImeCompositionKeyDown(e)) {
            return
          }
          if (e.key === 'Enter') {
            skipNextBlurCommitRef.current = true
            commitDraftValue()
            e.currentTarget.blur()
            return
          }
          if (e.key === 'Escape') {
            skipNextBlurCommitRef.current = true
            resetDraftValue()
            e.currentTarget.blur()
          }
        }}
        className="flex-1 text-xs"
      />
      <Button
        variant="outline"
        size="sm"
        onPointerDown={() => {
          skipNextBlurCommitRef.current = true
        }}
        onClick={() => void handleBrowse()}
        className="shrink-0 gap-1.5"
      >
        <FolderOpen className="size-3.5" />
        {t('auto.components.settings.GeneralWorkspaceSettingsSection.5567191a6e', 'Browse')}
      </Button>
    </div>
  )
}
