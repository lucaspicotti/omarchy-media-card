const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

test('playerLabel usa o identity informado pelo player', () => {
  assert.strictEqual(Model.playerLabel({ identity: 'Spotify', desktopEntry: 'spotify' }), 'Spotify')
})

test('playerLabel usa o desktopEntry com inicial maiúscula quando não há identity', () => {
  assert.strictEqual(Model.playerLabel({ identity: '', desktopEntry: 'spotify' }), 'Spotify')
})

test('playerLabel usa o nome D-Bus sem prefixo MPRIS e sem sufixo de instância', () => {
  assert.strictEqual(Model.playerLabel({ dbusName: 'org.mpris.MediaPlayer2.mpv' }), 'Mpv')
  assert.strictEqual(Model.playerLabel({ dbusName: 'org.mpris.MediaPlayer2.chromium.instance4821' }), 'Chromium')
})

test('playerLabel devolve texto vazio para player ausente ou sem nome', () => {
  for (const player of [null, undefined, {}]) {
    assert.strictEqual(Model.playerLabel(player), '', `player: ${JSON.stringify(player)}`)
  }
})
