import { describe, expect, it } from 'vitest'
import { plansHomeRoot } from './plans-home-root'

describe.runIf(process.platform !== 'win32')('plansHomeRoot on POSIX', () => {
  const home = '/home/me'

  it.each([
    [undefined, '/home/me/plans'],
    ['', '/home/me/plans'],
    ['   ', '/home/me/plans'],
    ['~', '/home/me'],
    ['~/notes/plans', '/home/me/notes/plans'],
    ['/srv/plans/', '/srv/plans'],
    ['  /srv/plans  ', '/srv/plans'],
    ['notes/plans', '/home/me/plans'],
    ['~\\notes', '/home/me/plans']
  ])('resolves %j to %s', (plansFolderPath, expected) => {
    expect(plansHomeRoot({ plansFolderPath }, home)).toBe(expected)
  })
})

describe.runIf(process.platform === 'win32')('plansHomeRoot on Windows', () => {
  const home = 'C:\\Users\\me'

  it.each([
    [undefined, 'C:\\Users\\me\\plans'],
    ['', 'C:\\Users\\me\\plans'],
    ['   ', 'C:\\Users\\me\\plans'],
    ['~', 'C:\\Users\\me'],
    ['~/notes/plans', 'C:\\Users\\me\\notes\\plans'],
    ['~\\notes\\plans', 'C:\\Users\\me\\notes\\plans'],
    ['D:\\workspace\\plans', 'D:\\workspace\\plans'],
    ['D:/workspace/plans/', 'D:\\workspace\\plans'],
    ['notes\\plans', 'C:\\Users\\me\\plans'],
    ['\\plans', 'C:\\Users\\me\\plans'],
    ['/plans', 'C:\\Users\\me\\plans']
  ])('resolves %j to %s', (plansFolderPath, expected) => {
    expect(plansHomeRoot({ plansFolderPath }, home)).toBe(expected)
  })
})
