const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs, plain } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

const DEFAULTS = {
  barStyle: 'icon',
  hideWhenIdle: true
}

test('settingsFrom aplica os padrões quando nada foi configurado', () => {
  assert.deepStrictEqual(plain(Model.settingsFrom({})), DEFAULTS)
})

test('settingsFrom mantém valores válidos configurados pelo usuário', () => {
  const custom = {
    barStyle: 'controls',
    hideWhenIdle: false
  }
  assert.deepStrictEqual(plain(Model.settingsFrom(custom)), custom)
  assert.strictEqual(Model.settingsFrom({ barStyle: 'minimal' }).barStyle, 'minimal')
})

test('settingsFrom ignora valores inválidos e usa o padrão', () => {
  const invalid = {
    barStyle: 'gigante',
    hideWhenIdle: null
  }
  assert.deepStrictEqual(plain(Model.settingsFrom(invalid)), DEFAULTS)
})

test('settingsFrom aplica os padrões quando a configuração está ausente', () => {
  for (const raw of [null, undefined]) {
    assert.deepStrictEqual(plain(Model.settingsFrom(raw)), DEFAULTS, `configuração: ${raw}`)
  }
})

test('settingsFrom não devolve opções que o widget não usa', () => {
  const result = plain(Model.settingsFrom({ showVolume: true, showOthers: false }))
  assert.deepStrictEqual(Object.keys(result).sort(), ['barStyle', 'hideWhenIdle'])
})
