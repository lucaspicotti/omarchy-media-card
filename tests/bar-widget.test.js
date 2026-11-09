const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

// There is no QML runtime in the tests, so these read BarWidget.qml as text.
const source = fs.readFileSync(path.join(__dirname, '..', 'BarWidget.qml'), 'utf8')

function block(name) {
  const start = source.indexOf(name)
  assert.notStrictEqual(start, -1, `bloco ${name} não encontrado`)
  let depth = 0
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1)
  }
  return source.slice(start)
}

test('BarWidget não guarda estado de um card que ainda não existe', () => {
  assert.doesNotMatch(source, /cardOpen/)
})

test('BarWidget mantém close(), que o Bar.qml do Omarchy chama', () => {
  assert.match(source, /function close\(\)/)
})

test('o Timer da linha de progresso depende só da linha visível e do player tocando', () => {
  const timer = block('Timer {')
  assert.match(timer, /running: progressLine\.visible && root\.controls\.playing\s*\n/)
})

test('clique esquerdo e do meio fazem play/pause', () => {
  const mouseArea = block('MouseArea {')
  assert.match(mouseArea, /acceptedButtons: Qt\.LeftButton \| Qt\.MiddleButton/)
  assert.match(mouseArea, /onClicked: root\.playPause\(\)/)
})
