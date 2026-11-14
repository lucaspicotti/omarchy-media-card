const test = require('node:test')
const assert = require('node:assert')
const { readQml, block } = require('./qml-source.js')

const source = readQml('BarWidget.qml')

test('BarWidget não guarda estado de um card que ainda não existe', () => {
  assert.doesNotMatch(source, /cardOpen/)
})

test('BarWidget mantém close(), que o Bar.qml do Omarchy chama', () => {
  assert.match(source, /function close\(\)/)
})

test('o Timer da linha de progresso depende só da linha visível e do player tocando', () => {
  const timer = block(source, 'Timer {')
  assert.match(timer, /running: progressLine\.visible && root\.controls\.playing\s*\n/)
})

// Design 1: right click switches players, the wheel changes the player's
// volume. Left and middle click play or pause until the card exists.
test('clique esquerdo e do meio fazem play/pause e o direito troca de player', () => {
  const mouseArea = block(source, 'MouseArea {')
  assert.match(mouseArea, /acceptedButtons: Qt\.LeftButton \| Qt\.MiddleButton \| Qt\.RightButton/)
  assert.match(mouseArea, /Qt\.RightButton\) root\.switchPlayer\(\)/)
  assert.match(mouseArea, /else root\.playPause\(\)/)
})

test('a roda do mouse muda o volume do player, no widget e nos botões', () => {
  assert.match(block(source, 'MouseArea {'), /onWheel: function\(wheel\) \{ root\.wheel\(wheel\.angleDelta\.y\) \}/)
  assert.match(block(source, 'component TransportButton'), /onWheelMoved: function\(delta\) \{ root\.wheel\(delta\) \}/)
  const wheel = block(source, 'function wheel(')
  assert.match(wheel, /controls\.enabled\.volume/)
  assert.match(wheel, /Model\.volumeAfter\(/)
})
