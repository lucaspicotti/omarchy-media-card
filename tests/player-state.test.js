const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

test('playerState devolve "playing" para player tocando', () => {
  assert.strictEqual(Model.playerState({ isPlaying: true }), 'playing')
})

test('playerState devolve "paused" para player que não está tocando', () => {
  assert.strictEqual(Model.playerState({ isPlaying: false }), 'paused')
})

test('playerState devolve texto vazio para player ausente', () => {
  for (const player of [null, undefined]) {
    assert.strictEqual(Model.playerState(player), '', `player: ${player}`)
  }
})
