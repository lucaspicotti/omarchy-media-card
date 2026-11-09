const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

function plain(value) {
  return JSON.parse(JSON.stringify(value))
}

// Property names as Quickshell's MprisPlayer exposes them.
const FULL = {
  canGoPrevious: true,
  canGoNext: true,
  canPlay: true,
  canPause: true,
  canTogglePlaying: true,
  canRaise: true,
  shuffleSupported: true,
  loopSupported: true
}

const NONE_ENABLED = { previous: false, playPause: false, next: false, shuffle: false, repeat: false, raise: false }

test('controlsFor habilita todos os botões de um player que suporta tudo', () => {
  const enabled = plain(Model.controlsFor(FULL)).enabled
  assert.deepStrictEqual(enabled, {
    previous: true,
    playPause: true,
    next: true,
    shuffle: true,
    repeat: true,
    raise: true
  })
})

// Same rule as MediaModel.canHandleAction("playPause") in Omarchy.
test('controlsFor habilita play/pause com canPlay ou canPause, sem canTogglePlaying', () => {
  assert.strictEqual(Model.controlsFor({ canPlay: true }).enabled.playPause, true)
  assert.strictEqual(Model.controlsFor({ canPause: true }).enabled.playPause, true)
})

test('controlsFor informa se está tocando e se o aleatório está ligado', () => {
  const on = Model.controlsFor(Object.assign({}, FULL, { isPlaying: true, shuffle: true }))
  assert.deepStrictEqual([on.playing, on.shuffleOn], [true, true])
  const off = Model.controlsFor(Object.assign({}, FULL, { isPlaying: false, shuffle: false }))
  assert.deepStrictEqual([off.playing, off.shuffleOn], [false, false])
})

// MprisLoopState in Quickshell's qmltypes: None, Track, Playlist (0, 1, 2).
test('controlsFor traduz o loopState do Quickshell para o modo de repetição', () => {
  const modes = [0, 1, 2].map((loopState) => Model.controlsFor(Object.assign({}, FULL, { loopState })).repeatMode)
  assert.deepStrictEqual(modes, ['none', 'track', 'playlist'])
})

test('controlsFor usa "none" para loopState ausente ou desconhecido', () => {
  for (const loopState of [undefined, null, -1, 3, 'Track']) {
    const mode = Model.controlsFor(Object.assign({}, FULL, { loopState })).repeatMode
    assert.strictEqual(mode, 'none', `loopState: ${loopState}`)
  }
})

test('controlsFor desabilita tudo quando não há player', () => {
  for (const player of [null, undefined]) {
    assert.deepStrictEqual(plain(Model.controlsFor(player)), {
      enabled: NONE_ENABLED,
      playing: false,
      shuffleOn: false,
      repeatMode: 'none'
    }, `player: ${player}`)
  }
})

test('controlsFor desabilita os botões que o player não suporta', () => {
  assert.deepStrictEqual(plain(Model.controlsFor({})).enabled, NONE_ENABLED)
})
