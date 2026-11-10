import { execFileSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { getLocalBuildIdentity } from './build-mac-local.mjs'

if (existsSync('.env')) {
  process.loadEnvFile('.env')
}
if (!process.env.CSC_NAME) {
  console.error('[install:mac] CSC_NAME is not set. Add the signing certificate name to .env.')
  process.exit(1)
}

const identity = getLocalBuildIdentity()
console.log(`[install:mac] local build version ${identity.version}`)
execFileSync(
  'pnpm',
  [
    'exec',
    'electron-builder',
    '--config',
    'config/electron-builder.config.cjs',
    '--mac',
    'dir',
    '--arm64'
  ],
  {
    env: {
      ...process.env,
      ORCA_BUILD_COMMIT: identity.commit,
      ORCA_LOCAL_BUILD_VERSION: identity.version
    },
    stdio: 'inherit'
  }
)

const built = resolve('dist/mac-arm64/Orca.app')
const target = '/Applications/Orca.app'
if (!existsSync(built)) {
  console.error(`[install:mac] Built app not found: ${built}`)
  process.exit(1)
}

// Quitting Orca also kills a terminal running inside it, so a detached shell does the swap.
const script = `
osascript -e 'quit app "Orca"' >/dev/null 2>&1
for _ in $(seq 120); do
  pgrep -xq Orca || break
  sleep 0.5
done
pgrep -xq Orca && exit 1
rm -rf "${target}.bak"
[ -e "${target}" ] && mv "${target}" "${target}.bak"
ditto "${built}" "${target}"
open "${target}"
`

spawn('/bin/sh', ['-c', script], { detached: true, stdio: 'ignore' }).unref()
console.log('[install:mac] Quitting Orca, replacing it with the new build, and relaunching.')
