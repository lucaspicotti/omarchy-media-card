const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs, plain } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

const DEFAULTS = {
  barStyle: 'icon',
  hideWhenIdle: true,
  showVolume: false,
  showOthers: true
}

test('settingsFrom aplica os padrões quando nada foi configurado', () => {
  assert.deepStrictEqual(plain(Model.settingsFrom({})), DEFAULTS)
})

test('settingsFrom mantém valores válidos configurados pelo usuário', () => {
  const custom = {
    barStyle: 'controls',
    hideWhenIdle: false,
    showVolume: true,
    showOthers: false
  }
  assert.deepStrictEqual(plain(Model.settingsFrom(custom)), custom)
  assert.strictEqual(Model.settingsFrom({ barStyle: 'minimal' }).barStyle, 'minimal')
})

test('settingsFrom ignora valores inválidos e usa o padrão', () => {
  const invalid = {
    barStyle: 'gigante',
    hideWhenIdle: null,
    showVolume: 'sim',
    showOthers: 0
  }
  assert.deepStrictEqual(plain(Model.settingsFrom(invalid)), DEFAULTS)
})

test('settingsFrom aplica os padrões quando a configuração está ausente', () => {
  for (const raw of [null, undefined]) {
    assert.deepStrictEqual(plain(Model.settingsFrom(raw)), DEFAULTS, `configuração: ${raw}`)
  }
})

test('settingsFrom ignora chaves que o plugin não conhece', () => {
  const result = plain(Model.settingsFrom({ volume: 80, id: 'lucaspicotti.media-card' }))
  assert.deepStrictEqual(result, DEFAULTS)
})
