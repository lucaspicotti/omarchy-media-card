const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

// MprisLoopState in Quickshell's qmltypes: None, Track, Playlist (0, 1, 2).
// The repeat button goes off, whole list, this track, off, as players do.
test('nextLoopState vai de desligado para a lista, da lista para a faixa e volta', () => {
  assert.strictEqual(Model.nextLoopState(0), 2)
  assert.strictEqual(Model.nextLoopState(2), 1)
  assert.strictEqual(Model.nextLoopState(1), 0)
})

test('nextLoopState trata valor desconhecido como desligado', () => {
  for (const loopState of [undefined, null, -1, 3, 'Track']) {
    assert.strictEqual(Model.nextLoopState(loopState), 2, `loopState: ${loopState}`)
  }
})
