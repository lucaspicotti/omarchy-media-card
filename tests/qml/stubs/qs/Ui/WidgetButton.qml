import QtQuick

// Like the real one: the MouseArea takes all three buttons and is off while
// not interactive, pressed(button) fires on click, and the bar tooltip only
// shows while tooltipHovered.
Item {
  id: root
  property var bar: null
  property string text: ""
  property color foreground: "white"
  property bool dimmed: false
  property bool interactive: true
  property string tooltipText: ""
  readonly property bool tooltipHovered: visible && interactive && mouseArea.containsMouse

  signal pressed(int button)
  signal wheelMoved(int delta)

  implicitWidth: 18
  implicitHeight: 18

  MouseArea {
    id: mouseArea
    anchors.fill: parent
    acceptedButtons: Qt.LeftButton | Qt.RightButton | Qt.MiddleButton
    enabled: root.interactive
    hoverEnabled: true
    onEntered: if (root.bar) root.bar.showTooltip(root, root.tooltipText)
    onExited: if (root.bar) root.bar.hideTooltip(root)
    onClicked: function(mouse) { root.pressed(mouse.button) }
    onWheel: function(wheel) { root.wheelMoved(wheel.angleDelta.y) }
  }
}
