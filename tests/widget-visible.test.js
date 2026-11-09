const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

test('widgetVisible mostra o widget quando há mídia', () => {
  assert.strictEqual(Model.widgetVisible(true, true), true)
  assert.strictEqual(Model.widgetVisible(true, false), true)
})

test('widgetVisible esconde o widget sem mídia quando a opção de esconder está ligada', () => {
  assert.strictEqual(Model.widgetVisible(false, true), false)
})

test('widgetVisible mantém o widget sem mídia quando a opção de esconder está desligada', () => {
  assert.strictEqual(Model.widgetVisible(false, false), true)
})
