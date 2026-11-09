const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs, plain } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

test('nowPlaying devolve a faixa do player com a capa já validada', () => {
  const player = { trackTitle: 'Maria Tambiên', trackArtist: 'Khruangbin', trackArtUrl: 'https://i.scdn.co/image/x' }
  assert.deepStrictEqual(plain(Model.nowPlaying(player)), {
    hasMedia: true, title: 'Maria Tambiên', artist: 'Khruangbin', artUrl: 'https://i.scdn.co/image/x'
  })
  assert.strictEqual(Model.nowPlaying({ trackTitle: 'x', trackArtUrl: 'javascript:alert(1)' }).artUrl, '')
})

test('nowPlaying devolve campos vazios sem player ou sem faixa', () => {
  const empty = { hasMedia: false, title: '', artist: '', artUrl: '' }
  for (const player of [null, undefined, { isPlaying: true }]) {
    assert.deepStrictEqual(plain(Model.nowPlaying(player)), empty, `player: ${JSON.stringify(player)}`)
  }
})

test('playPauseMethod prefere togglePlaying e cai para pause ou play', () => {
  assert.strictEqual(Model.playPauseMethod({ canTogglePlaying: true, canPause: true }), 'togglePlaying')
  assert.strictEqual(Model.playPauseMethod({ isPlaying: true, canPause: true }), 'pause')
  assert.strictEqual(Model.playPauseMethod({ isPlaying: false, canPlay: true }), 'play')
})

test('playPauseMethod devolve vazio quando o player não pode', () => {
  for (const player of [null, undefined, {}, { isPlaying: true, canPlay: true }, { isPlaying: false, canPause: true }]) {
    assert.strictEqual(Model.playPauseMethod(player), '', `player: ${JSON.stringify(player)}`)
  }
})
