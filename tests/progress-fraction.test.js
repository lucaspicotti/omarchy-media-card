const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

test('progressFraction divide a posição pela duração', () => {
  assert.strictEqual(Model.progressFraction(50, 200), 0.25)
})

test('progressFraction fica entre 0 e 1 mesmo com posição fora da faixa', () => {
  assert.strictEqual(Model.progressFraction(250, 200), 1)
  assert.strictEqual(Model.progressFraction(-10, 200), 0)
})

test('progressFraction devolve 0 quando a duração é zero ou inválida', () => {
  for (const length of [0, -1, NaN, Infinity, undefined, null, 'abc']) {
    assert.strictEqual(Model.progressFraction(30, length), 0, `duração: ${length}`)
  }
})

test('progressFraction devolve 0 quando a posição é inválida', () => {
  for (const position of [NaN, undefined, null, 'abc']) {
    assert.strictEqual(Model.progressFraction(position, 200), 0, `posição: ${position}`)
  }
})
