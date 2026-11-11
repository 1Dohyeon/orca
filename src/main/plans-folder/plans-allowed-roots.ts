import type { RuntimeStore } from '../runtime/construction/runtime-store-contract'
import { getAllowedRoots } from '../ipc/filesystem/access/filesystem-allowed-roots'
import { plansHomeRoot } from './plans-home-root'

/** Local file access also covers the configured plans root so the explorer can show and edit repo plans. */
export async function getAllowedRootsWithPlans(store: RuntimeStore): Promise<string[]> {
  return [...(await getAllowedRoots(store)), plansHomeRoot(store.getSettings())]
}
