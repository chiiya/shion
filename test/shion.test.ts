import { shion } from '../src'
import { pathExists, stat } from 'fs-extra'

describe('Shion Integration Tests', () => {
  it('optimizes images', async () => {
    await shion.images(__dirname + '/images', __dirname + '/dist/images')
    const exists = await pathExists(__dirname + '/dist/images')
    expect(exists).toBeTruthy()
    const inputs = ['banner-winter.svg', '545519333.jpg', 'avatars/avatar.png']
    for (const input of inputs) {
      const exists = await pathExists(__dirname + '/dist/images/' + input)
      const fileIn = await stat(__dirname + '/images/' + input)
      const fileOut = await stat(__dirname + '/dist/images/' + input)
      expect(exists).toBeTruthy()
      expect(fileOut.size).toBeLessThan(fileIn.size)
    }
  })
})
