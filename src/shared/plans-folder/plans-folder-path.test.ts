import { describe, expect, it } from 'vitest'
import { plansFolderRelativePath } from './plans-folder-path'

describe('plansFolderRelativePath', () => {
  it.each([
    ['https://github.com/1Dohyeon/belloga', '1Dohyeon/belloga'],
    ['https://github.com/1Dohyeon/belloga.git', '1Dohyeon/belloga'],
    ['git@github.com:1Dohyeon/belloga.git', '1Dohyeon/belloga'],
    ['ssh://git@github.com/1Dohyeon/belloga.git', '1Dohyeon/belloga'],
    ['https://gitlab.example.test/group/sub/Project.git', 'sub/Project']
  ])('uses the last two path segments of %s', (originUrl, expected) => {
    expect(plansFolderRelativePath(originUrl, 'main-clone')).toBe(expected)
  })

  it.each([null, '', '/Users/me/repos/bare.git', 'https://github.com/only-owner'])(
    'falls back to the local folder name when origin is %s',
    (originUrl) => {
      expect(plansFolderRelativePath(originUrl, 'belloga')).toBe('_local/belloga')
    }
  )
})
