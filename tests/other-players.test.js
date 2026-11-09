const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs, plain } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

const SPOTIFY = { dbusName: 'org.mpris.MediaPlayer2.spotify', identity: 'Spotify', trackTitle: 'Maria Tambiên', isPlaying: true }
const CHROME = { dbusName: 'org.mpris.MediaPlayer2.chromium.instance4821', identity: 'Chromium', trackTitle: 'Vídeo do YouTube', isPlaying: false }
const MPV = { dbusName: 'org.mpris.MediaPlayer2.mpv', identity: 'mpv', trackTitle: 'podcast-ep42.mp3', isPlaying: true }

test('otherPlayers lista os outros players com chave, nome, título e estado', () => {
  const others = plain(Model.otherPlayers([SPOTIFY, CHROME, MPV], SPOTIFY.dbusName, true))
  assert.deepStrictEqual(others, [
    { key: 'org.mpris.MediaPlayer2.chromium.instance4821', label: 'Chromium', title: 'Vídeo do YouTube', state: 'paused' },
    { key: 'org.mpris.MediaPlayer2.mpv', label: 'mpv', title: 'podcast-ep42.mp3', state: 'playing' }
  ])
})

// Matches tabsFor: with no valid selection the first player is the one shown.
test('otherPlayers deixa de fora o primeiro player quando o selecionado não está na lista', () => {
  for (const selectedKey of ['org.mpris.MediaPlayer2.fechado', '', null]) {
    const others = plain(Model.otherPlayers([SPOTIFY, CHROME, MPV], selectedKey, true))
    assert.deepStrictEqual(others.map((o) => o.label), ['Chromium', 'mpv'], `selecionado: ${selectedKey}`)
  }
})

test('otherPlayers usa título vazio quando o player não informa a faixa', () => {
  const noTrack = { dbusName: 'org.mpris.MediaPlayer2.vlc', identity: 'VLC', isPlaying: false }
  const others = Model.otherPlayers([SPOTIFY, noTrack], SPOTIFY.dbusName, true)
  assert.strictEqual(others[0].title, '')
})

// Omarchy's media service skips empty entries (`if (!p) continue`): a player
// that is closing can leave a null in the list.
test('otherPlayers ignora entradas vazias na lista de players', () => {
  const others = plain(Model.otherPlayers([SPOTIFY, null, CHROME, undefined], SPOTIFY.dbusName, true))
  assert.deepStrictEqual(others.map((o) => o.label), ['Chromium'])
})

test('otherPlayers devolve lista vazia com um player só ou sem lista', () => {
  assert.deepStrictEqual(plain(Model.otherPlayers([SPOTIFY], SPOTIFY.dbusName, true)), [])
  for (const players of [null, undefined, []]) {
    assert.deepStrictEqual(plain(Model.otherPlayers(players, '', true)), [], `players: ${players}`)
  }
})

test('otherPlayers devolve lista vazia quando "Também tocando" está desligado', () => {
  assert.deepStrictEqual(plain(Model.otherPlayers([SPOTIFY, CHROME], SPOTIFY.dbusName, false)), [])
})
