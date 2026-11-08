const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

test('widgetVisible mostra o widget quando há mídia', () => {
  assert.strictEqual(Model.widgetVisible(true, { hideWhenIdle: true }), true)
  assert.strictEqual(Model.widgetVisible(true, { hideWhenIdle: false }), true)
})

test('widgetVisible esconde o widget sem mídia quando a opção de esconder está ligada', () => {
  assert.strictEqual(Model.widgetVisible(false, { hideWhenIdle: true }), false)
})

test('widgetVisible mantém o widget sem mídia quando a opção de esconder está desligada', () => {
  assert.strictEqual(Model.widgetVisible(false, { hideWhenIdle: false }), true)
})

// Omarchy's media service computes hasMedia as `player && (title || artist)`,
// so it can arrive as a string or null instead of a boolean.
test('widgetVisible sempre devolve booleano, mesmo com hasMedia em texto', () => {
  assert.strictEqual(Model.widgetVisible('Maria Tambiên', { hideWhenIdle: true }), true)
  assert.strictEqual(Model.widgetVisible('', { hideWhenIdle: true }), false)
  assert.strictEqual(Model.widgetVisible(null, { hideWhenIdle: true }), false)
})

test('widgetVisible segue o padrão (esconder) quando a configuração está ausente ou inválida', () => {
  for (const settings of [undefined, null, {}, { hideWhenIdle: 'não' }]) {
    assert.strictEqual(Model.widgetVisible(false, settings), false, `configuração: ${JSON.stringify(settings)}`)
  }
})
