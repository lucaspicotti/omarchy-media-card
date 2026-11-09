const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const { loadQmlJs, plain } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'))

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
  const booleans = schema().filter((field) => typeof field.defaultValue === 'boolean')
  assert.ok(booleans.length > 0)
  for (const field of booleans) assert.strictEqual(field.type, 'boolean', `opção: ${field.key}`)
})

// The card comes in another branch; until then the settings screen offers only
// what BarWidget.qml reads, and the descriptions do not promise it.
test('manifest só oferece opções que o widget da barra lê', () => {
  const widget = fs.readFileSync(path.join(__dirname, '..', 'BarWidget.qml'), 'utf8')
  for (const field of schema()) assert.match(widget, new RegExp(`config\\.${field.key}\\b`), `opção: ${field.key}`)
})

test('descrições do manifest não falam do card', () => {
  for (const text of [manifest.description, manifest.barWidget.description]) {
    assert.doesNotMatch(text, /card/i)
  }
})
