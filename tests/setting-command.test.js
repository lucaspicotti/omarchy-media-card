const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs, plain } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

// The card's settings screen saves through `omarchy-bar set`, which writes the
// widget's entry in shell.json; the bar hands the new settings back live.
test('settingCommand monta o omarchy-bar set com o valor em JSON', () => {
  assert.deepStrictEqual(plain(Model.settingCommand('showVolume', true)),
    ['omarchy-bar', 'set', 'lucaspicotti.media-card', 'showVolume', 'true', '--json'])
  assert.deepStrictEqual(plain(Model.settingCommand('barStyle', 'controls')),
    ['omarchy-bar', 'set', 'lucaspicotti.media-card', 'barStyle', '"controls"', '--json'])
})

test('settingCommand recusa chave desconhecida ou valor inválido', () => {
  const invalid = [['volume', 1], ['barStyle', 'gigante'], ['showVolume', 'sim'], ['hideWhenIdle', null], ['toString', true]]
  for (const [key, value] of invalid) {
    assert.deepStrictEqual(plain(Model.settingCommand(key, value)), [], `${key}: ${value}`)
  }
})
