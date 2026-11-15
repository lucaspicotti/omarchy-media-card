const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

// Third-party plugins cannot reach Omarchy's media service, so the plugin
// picks the player itself from Quickshell's MPRIS list.
const SPOTIFY = { dbusName: 'org.mpris.MediaPlayer2.spotify', identity: 'Spotify', trackTitle: 'Signal from the Noise', isPlaying: false }
const CHROME = { dbusName: 'org.mpris.MediaPlayer2.chromium.instance4821', identity: 'Chromium', trackTitle: 'Vídeo do YouTube', isPlaying: true }
// Like the idle Chrome seen on this machine: a player with no track at all.
const IDLE_CHROME = { dbusName: 'org.mpris.MediaPlayer2.chromium.instance1', identity: 'Chrome', isPlaying: false }

test('activePlayer escolhe o player preferido quando ele está na lista', () => {
  assert.strictEqual(Model.activePlayer([SPOTIFY, CHROME], SPOTIFY.dbusName), SPOTIFY)
})

test('activePlayer escolhe o player que está tocando quando não há preferido', () => {
  for (const preferredKey of ['', null, 'org.mpris.MediaPlayer2.fechado']) {
    assert.strictEqual(Model.activePlayer([SPOTIFY, CHROME], preferredKey), CHROME, `preferido: ${preferredKey}`)
  }
})

test('activePlayer devolve null quando nenhum player tem faixa ou não há lista', () => {
  for (const players of [[IDLE_CHROME], [], null, undefined]) {
    assert.strictEqual(Model.activePlayer(players, ''), null, `players: ${JSON.stringify(players)}`)
  }
})

test('activePlayer ignora o preferido quando ele ficou sem faixa', () => {
  const playingSpotify = Object.assign({}, SPOTIFY, { isPlaying: true })
  assert.strictEqual(Model.activePlayer([IDLE_CHROME, playingSpotify], IDLE_CHROME.dbusName), playingSpotify)
})

test('activePlayer escolhe o primeiro player com faixa quando nada está tocando', () => {
  const artistOnly = { dbusName: 'org.mpris.MediaPlayer2.mpv', trackArtist: 'BADBADNOTGOOD', isPlaying: false }
  assert.strictEqual(Model.activePlayer([IDLE_CHROME, SPOTIFY], ''), SPOTIFY)
  assert.strictEqual(Model.activePlayer([IDLE_CHROME, artistOnly], ''), artistOnly)
})

// A browser playing something without metadata must not hide a paused player
// that has a track: the widget would vanish while there is media to show.
test('activePlayer não escolhe um player tocando sem faixa', () => {
  const playingNoTrack = { dbusName: 'org.mpris.MediaPlayer2.firefox.instance9', identity: 'Firefox', isPlaying: true }
  assert.strictEqual(Model.activePlayer([playingNoTrack, SPOTIFY], ''), SPOTIFY)
})

// playerctld mirrors whichever player is active; Omarchy's media service
// leaves it out the same way (MediaModel.isProxyPlayer).
test('activePlayer ignora o proxy playerctld', () => {
  const proxy = { dbusName: 'org.mpris.MediaPlayer2.playerctld', identity: 'playerctld', trackTitle: 'Signal from the Noise', isPlaying: true }
  assert.strictEqual(Model.activePlayer([proxy, SPOTIFY], ''), SPOTIFY)
  assert.strictEqual(Model.activePlayer([proxy, SPOTIFY], proxy.dbusName), SPOTIFY)
})

// The chosen player stays on until another one starts playing, like
// Omarchy's media service, which keeps its preferred player only while it plays.
test('preferredKeyAfter esquece o escolhido quando outro player começa a tocar', () => {
  assert.strictEqual(Model.preferredKeyAfter(SPOTIFY.dbusName, CHROME.dbusName), '')
})

test('preferredKeyAfter mantém o escolhido quando é ele que toca ou quando nada toca', () => {
  assert.strictEqual(Model.preferredKeyAfter(SPOTIFY.dbusName, SPOTIFY.dbusName), SPOTIFY.dbusName)
  assert.strictEqual(Model.preferredKeyAfter(SPOTIFY.dbusName, ''), SPOTIFY.dbusName)
})

test('playingPlayerKey é o primeiro player com faixa que está tocando', () => {
  const playingNoTrack = { dbusName: 'org.mpris.MediaPlayer2.firefox.instance9', isPlaying: true }
  assert.strictEqual(Model.playingPlayerKey([playingNoTrack, SPOTIFY, CHROME]), CHROME.dbusName)
  assert.strictEqual(Model.playingPlayerKey([SPOTIFY]), '')
  assert.strictEqual(Model.playingPlayerKey(null), '')
})
