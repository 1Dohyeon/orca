import { ipcRenderer } from 'electron'

export type PlansFolderApi = {
  resolveRoot: (args: { worktreePath: string }) => Promise<string | null>
}

export const plansFolderApi: PlansFolderApi = {
  resolveRoot: (args) => ipcRenderer.invoke('plans:resolveRoot', args)
}
