import { app } from 'electron'

// Local builds carry a `local.` prerelease identifier and must not be replaced by the official feed.
export function isLocalCustomBuildVersion(version: string): boolean {
  const prerelease = version.split('+')[0].split('-').slice(1).join('-')
  return /(?:^|\.)local\./.test(prerelease)
}

export function isUpdaterInactiveBuild(): boolean {
  return !app.isPackaged || isLocalCustomBuildVersion(app.getVersion())
}
