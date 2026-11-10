import { execFileSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { getLocalBuildIdentity } from '../macos/build-mac-local.mjs'

const identity = getLocalBuildIdentity()
console.log(`[install:win] local build version ${identity.version}`)
execFileSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  [
    'exec',
    'electron-builder',
    '--config',
    'config/electron-builder.config.cjs',
    '--win',
    'nsis',
    '--x64'
  ],
  {
    env: {
      ...process.env,
      ORCA_BUILD_COMMIT: identity.commit,
      ORCA_LOCAL_BUILD_VERSION: identity.version
    },
    shell: process.platform === 'win32',
    stdio: 'inherit'
  }
)

const installer = resolve('dist/orca-windows-setup.exe')
if (!existsSync(installer)) {
  console.error(`[install:win] Installer not found: ${installer}`)
  process.exit(1)
}

// Killing Orca Custom also kills a terminal running inside it, so a detached console runs the installer.
// Only the local-build executable is targeted; the official Orca.exe keeps running.
const script = `taskkill /IM "Orca Custom.exe" /F >nul 2>&1 & ping -n 3 127.0.0.1 >nul & "${installer}" /S --force-run`

spawn('cmd.exe', ['/d', '/s', '/c', `"${script}"`], {
  detached: true,
  stdio: 'ignore',
  windowsHide: true,
  windowsVerbatimArguments: true
}).unref()
console.log('[install:win] Closing Orca Custom, installing the new build, and relaunching.')
