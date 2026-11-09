const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

// Third-party plugins cannot reach Omarchy's media service, so the plugin
// picks the player itself from Quickshell's MPRIS list.
const SPOTIFY = { dbusName: 'org.mpris.MediaPlayer2.spotify', identity: 'Spotify', trackTitle: 'Signal from the Noise', isPlaying: false }
const CHROME = { dbusName: 'org.mpris.MediaPlayer2.chromium.instance4821', identity: 'Chromium', trackTitle: 'Vídeo do YouTube', isPlaying: true }

test('activePlayer escolhe o player preferido quando ele está na lista', () => {
  assert.strictEqual(Model.activePlayer([SPOTIFY, CHROME], SPOTIFY.dbusName), SPOTIFY)
})

test('activePlayer escolhe o player que está tocando quando não há preferido', () => {
  for (const preferredKey of ['', null, 'org.mpris.MediaPlayer2.fechado']) {
    assert.strictEqual(Model.activePlayer([SPOTIFY, CHROME], preferredKey), CHROME, `preferido: ${preferredKey}`)
  }
})

test('activePlayer devolve null quando nenhum player tem faixa ou não há lista', () => {
  const idleChrome = { dbusName: 'org.mpris.MediaPlayer2.chromium.instance1', identity: 'Chrome', isPlaying: false }
  for (const players of [[idleChrome], [], null, undefined]) {
    assert.strictEqual(Model.activePlayer(players, ''), null, `players: ${JSON.stringify(players)}`)
  }
})

test('activePlayer ignora o preferido quando ele ficou sem faixa', () => {
  const idleChrome = { dbusName: 'org.mpris.MediaPlayer2.chromium.instance1', identity: 'Chrome', isPlaying: false }
  const playingSpotify = Object.assign({}, SPOTIFY, { isPlaying: true })
  assert.strictEqual(Model.activePlayer([idleChrome, playingSpotify], idleChrome.dbusName), playingSpotify)
})

// Like the idle Chrome seen on this machine: a player with no track at all.
test('activePlayer escolhe o primeiro player com faixa quando nada está tocando', () => {
  const idleChrome = { dbusName: 'org.mpris.MediaPlayer2.chromium.instance1', identity: 'Chrome', isPlaying: false }
  const artistOnly = { dbusName: 'org.mpris.MediaPlayer2.mpv', trackArtist: 'BADBADNOTGOOD', isPlaying: false }
  assert.strictEqual(Model.activePlayer([idleChrome, SPOTIFY], ''), SPOTIFY)
  assert.strictEqual(Model.activePlayer([idleChrome, artistOnly], ''), artistOnly)
})
