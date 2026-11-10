import { normalizeGitRemoteUrl } from '../git/remotes/git-remote-identity'

/** Path under ~/plans for a repo: `{owner}/{repo}` from origin, else `_local/{main clone folder}`. */
export function plansFolderRelativePath(
  originUrl: string | null,
  mainCloneFolderName: string
): string {
  const segments = originUrl ? (normalizeGitRemoteUrl(originUrl)?.split('/') ?? []) : []
  // segments[0] is the host, so owner and repo need at least two more.
  if (segments.length >= 3) {
    return segments.slice(-2).join('/')
  }
  return `_local/${mainCloneFolderName}`
}
