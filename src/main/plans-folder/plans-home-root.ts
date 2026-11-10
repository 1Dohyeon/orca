import { homedir } from 'node:os'
import { join } from 'node:path'

export function plansHomeRoot(): string {
  return join(homedir(), 'plans')
}
