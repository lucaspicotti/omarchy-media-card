const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

test('formatTime mostra minutos e segundos com dois dígitos', () => {
  assert.strictEqual(Model.formatTime(112), '1:52')
  assert.strictEqual(Model.formatTime(5), '0:05')
})

test('formatTime inclui horas quando a duração passa de uma hora', () => {
  assert.strictEqual(Model.formatTime(3725), '1:02:05')
})

test('formatTime mostra 0:00 para valores inválidos ou negativos', () => {
  for (const value of [-5, NaN, Infinity, undefined, null, 'abc']) {
    assert.strictEqual(Model.formatTime(value), '0:00', `valor: ${value}`)
  }
})

test('formatTime descarta frações de segundo', () => {
  assert.strictEqual(Model.formatTime(112.9), '1:52')
})
