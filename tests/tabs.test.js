const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs, plain } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

const SPOTIFY = { dbusName: 'org.mpris.MediaPlayer2.spotify', identity: 'Spotify', isPlaying: true }
const CHROME = { dbusName: 'org.mpris.MediaPlayer2.chromium.instance4821', identity: 'Chromium', isPlaying: false }

test('tabsFor cria uma aba por player, com a chave D-Bus e o nome amigável', () => {
  assert.deepStrictEqual(plain(Model.tabsFor([SPOTIFY, CHROME])), [
    { value: 'org.mpris.MediaPlayer2.spotify', label: 'Spotify' },
    { value: 'org.mpris.MediaPlayer2.chromium.instance4821', label: 'Chromium' }
  ])
})

// Same rule as MediaModel.playerKey in Omarchy's media service, so a tab key
// can be handed to its selectPlayer().
test('tabsFor usa desktopEntry e depois identity como chave quando falta o nome D-Bus', () => {
  const noDbus = { desktopEntry: 'vlc', identity: 'VLC media player' }
  const onlyIdentity = { identity: 'Rhythmbox' }
  const tabs = plain(Model.tabsFor([SPOTIFY, noDbus, onlyIdentity]))
  assert.deepStrictEqual(tabs.map((tab) => tab.value), ['org.mpris.MediaPlayer2.spotify', 'vlc', 'Rhythmbox'])
})

// Quickshell hands QML lists over as array-likes without Array.prototype
// methods, which is why Omarchy's media service walks them with plain loops.
test('tabsFor aceita lista parecida com array, como a que o Quickshell entrega', () => {
  const arrayLike = { length: 2, 0: SPOTIFY, 1: CHROME }
  assert.deepStrictEqual(plain(Model.tabsFor(arrayLike)).map((tab) => tab.label), ['Spotify', 'Chromium'])
})

test('tabsFor devolve lista vazia quando não há lista de players', () => {
  for (const players of [null, undefined]) {
    assert.deepStrictEqual(plain(Model.tabsFor(players)), [], `players: ${players}`)
  }
})

test('tabsFor não cria abas quando há um player só', () => {
  assert.deepStrictEqual(plain(Model.tabsFor([SPOTIFY])), [])
})
