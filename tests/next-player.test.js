const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

const SPOTIFY = { dbusName: 'org.mpris.MediaPlayer2.spotify', trackTitle: 'Maria Tambiên' }
const CHROME = { dbusName: 'org.mpris.MediaPlayer2.chromium.instance4821', trackTitle: 'Vídeo do YouTube' }
const MPV = { dbusName: 'org.mpris.MediaPlayer2.mpv', trackTitle: 'podcast-ep42.mp3' }
const IDLE = { dbusName: 'org.mpris.MediaPlayer2.vlc' }

// Right click on the bar widget walks the players that have a track.
test('nextPlayerKey passa para o próximo player com faixa e volta ao primeiro', () => {
  const list = [SPOTIFY, IDLE, CHROME, MPV]
  assert.strictEqual(Model.nextPlayerKey(list, SPOTIFY.dbusName), CHROME.dbusName)
  assert.strictEqual(Model.nextPlayerKey(list, CHROME.dbusName), MPV.dbusName)
  assert.strictEqual(Model.nextPlayerKey(list, MPV.dbusName), SPOTIFY.dbusName)
})

test('nextPlayerKey começa pelo segundo quando o atual não está entre os que têm faixa', () => {
  for (const current of ['', null, IDLE.dbusName]) {
    assert.strictEqual(Model.nextPlayerKey([SPOTIFY, CHROME], current), CHROME.dbusName, `atual: ${current}`)
  }
})

test('nextPlayerKey devolve vazio com menos de dois players com faixa', () => {
  for (const players of [[SPOTIFY, IDLE], [IDLE], [], null]) {
    assert.strictEqual(Model.nextPlayerKey(players, SPOTIFY.dbusName), '', `players: ${JSON.stringify(players)}`)
  }
})
