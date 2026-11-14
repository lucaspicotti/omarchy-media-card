const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

// MprisPlayer.volume runs from 0 to 1; one wheel notch moves it 5 points.
test('volumeAfter sobe e desce 5% por passo da roda', () => {
  assert.strictEqual(Model.volumeAfter(0.5, 1), 0.55)
  assert.strictEqual(Model.volumeAfter(0.5, -2), 0.4)
})

test('volumeAfter fica entre 0 e 1', () => {
  assert.strictEqual(Model.volumeAfter(0.98, 3), 1)
  assert.strictEqual(Model.volumeAfter(0.02, -1), 0)
  assert.strictEqual(Model.volumeAfter(1.4, 0), 1)
})

test('volumeAfter arredonda para centésimos, sem resto de ponto flutuante', () => {
  assert.strictEqual(Model.volumeAfter(0.1, 2), 0.2)
  assert.strictEqual(Model.volumeAfter(0.7, 1), 0.75)
})

test('volumeAfter trata volume inválido como zero', () => {
  for (const volume of [undefined, null, NaN, 'alto']) {
    assert.strictEqual(Model.volumeAfter(volume, 1), 0.05, `volume: ${volume}`)
  }
})
