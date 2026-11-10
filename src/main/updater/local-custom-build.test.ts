import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { isPackaged: true, getVersion: () => '1.4.214' } }))

import { isLocalCustomBuildVersion } from './local-custom-build'

describe('isLocalCustomBuildVersion', () => {
  it('detects a local build version', () => {
    expect(isLocalCustomBuildVersion('1.4.214-local.1700000000000.abc123def456')).toBe(true)
  })

  it('detects a local build of a prerelease version', () => {
    expect(isLocalCustomBuildVersion('1.4.214-rc.1.local.1700000000000.abc123def456')).toBe(true)
  })

  it('treats an official release as not local', () => {
    expect(isLocalCustomBuildVersion('1.4.214')).toBe(false)
  })

  it('treats an official rc prerelease as not local', () => {
    expect(isLocalCustomBuildVersion('1.4.214-rc.1')).toBe(false)
  })
})
