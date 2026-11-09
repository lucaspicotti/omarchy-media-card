const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs, plain } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

const SPOTIFY = { dbusName: 'org.mpris.MediaPlayer2.spotify', identity: 'Spotify', isPlaying: true }
const CHROME = { dbusName: 'org.mpris.MediaPlayer2.chromium.instance4821', identity: 'Chromium', isPlaying: false }
const MPV = { dbusName: 'org.mpris.MediaPlayer2.mpv', identity: 'mpv', isPlaying: false }

test('tabsFor cria uma aba por player, com a chave D-Bus e o nome amigável', () => {
  const tabs = plain(Model.tabsFor([SPOTIFY, CHROME], SPOTIFY.dbusName))
  assert.deepStrictEqual(tabs.map((tab) => [tab.key, tab.label]), [
    ['org.mpris.MediaPlayer2.spotify', 'Spotify'],
    ['org.mpris.MediaPlayer2.chromium.instance4821', 'Chromium']
  ])
})

test('tabsFor marca apenas a aba do player selecionado', () => {
  const tabs = plain(Model.tabsFor([SPOTIFY, CHROME, MPV], CHROME.dbusName))
  assert.deepStrictEqual(tabs.map((tab) => tab.selected), [false, true, false])
})

// Same rule as MediaModel.playerKey in Omarchy's media service, so a tab key
// can be handed to its selectPlayer().
test('tabsFor usa desktopEntry e depois identity como chave quando falta o nome D-Bus', () => {
  const noDbus = { desktopEntry: 'vlc', identity: 'VLC media player' }
  const onlyIdentity = { identity: 'Rhythmbox' }
  const tabs = plain(Model.tabsFor([SPOTIFY, noDbus, onlyIdentity], 'vlc'))
  assert.deepStrictEqual(tabs.map((tab) => [tab.key, tab.selected]), [
    ['org.mpris.MediaPlayer2.spotify', false],
    ['vlc', true],
    ['Rhythmbox', false]
  ])
})

test('tabsFor marca a primeira aba quando o selecionado não está na lista', () => {
  for (const selectedKey of ['org.mpris.MediaPlayer2.fechado', '', null, undefined]) {
    const tabs = plain(Model.tabsFor([SPOTIFY, CHROME], selectedKey))
    assert.deepStrictEqual(tabs.map((tab) => tab.selected), [true, false], `selecionado: ${selectedKey}`)
  }
})

// Quickshell hands QML lists over as array-likes without Array.prototype
// methods, which is why Omarchy's media service walks them with plain loops.
test('tabsFor aceita lista parecida com array, como a que o Quickshell entrega', () => {
  const arrayLike = { length: 2, 0: SPOTIFY, 1: CHROME }
  const tabs = plain(Model.tabsFor(arrayLike, CHROME.dbusName))
  assert.deepStrictEqual(tabs.map((tab) => [tab.label, tab.selected]), [['Spotify', false], ['Chromium', true]])
})

test('tabsFor devolve lista vazia quando não há lista de players', () => {
  for (const players of [null, undefined]) {
    assert.deepStrictEqual(plain(Model.tabsFor(players, '')), [], `players: ${players}`)
  }
})

test('tabsFor não cria abas quando há um player só', () => {
  assert.deepStrictEqual(plain(Model.tabsFor([SPOTIFY], SPOTIFY.dbusName)), [])
})
