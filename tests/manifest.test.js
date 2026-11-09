const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'))

function plain(value) {
  return JSON.parse(JSON.stringify(value))
}

function schema() {
  return (manifest.barWidget && manifest.barWidget.schema) || []
}

// The settings screen is built from the manifest; the widget reads the values
// through settingsFrom(). Both must agree on every key and default.
test('manifest declara as mesmas opções e padrões do DEFAULT_SETTINGS', () => {
  const fromManifest = {}
  for (const field of schema()) fromManifest[field.key] = field.defaultValue
  assert.deepStrictEqual(fromManifest, plain(Model.DEFAULT_SETTINGS))
})

test('manifest oferece exatamente os estilos de barra que o modelo aceita', () => {
  const barStyle = schema().find((field) => field.key === 'barStyle')
  assert.deepStrictEqual(barStyle.options.map((option) => option.value), plain(Model.BAR_STYLES))
})

test('manifest declara cada opção booleana com o tipo boolean', () => {
  const types = schema().filter((field) => field.key !== 'barStyle').map((field) => [field.key, field.type])
  assert.deepStrictEqual(types, [['showVolume', 'boolean'], ['showOthers', 'boolean'], ['hideWhenIdle', 'boolean']])
})
