const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

const SPOTIFY = { dbusName: 'org.mpris.MediaPlayer2.spotify', trackTitle: 'Maria Tambiên', isPlaying: true }
const MPV = { dbusName: 'org.mpris.MediaPlayer2.mpv', trackArtist: 'BADBADNOTGOOD', isPlaying: false }
// A browser with no tab playing still registers as a player, without a track.
const IDLE_CHROME = { dbusName: 'org.mpris.MediaPlayer2.chromium.instance1', isPlaying: false }

// activePlayer skips players without a track, so a tab for one would do nothing.
test('mediaPlayers deixa só os players com faixa, na ordem da lista', () => {
  assert.deepStrictEqual(Array.from(Model.mediaPlayers([IDLE_CHROME, SPOTIFY, MPV])), [SPOTIFY, MPV])
})

test('mediaPlayers aceita lista parecida com array e ignora entradas vazias', () => {
  const arrayLike = { length: 3, 0: SPOTIFY, 1: null, 2: MPV }
  assert.deepStrictEqual(Array.from(Model.mediaPlayers(arrayLike)), [SPOTIFY, MPV])
})

test('mediaPlayers devolve lista vazia sem lista de players', () => {
  for (const players of [null, undefined, []]) {
    assert.deepStrictEqual(Array.from(Model.mediaPlayers(players)), [], `players: ${players}`)
  }
})
