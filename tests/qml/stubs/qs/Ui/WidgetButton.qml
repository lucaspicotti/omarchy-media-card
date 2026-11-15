import QtQuick

// The real one emits pressed() on mouse press, and only while interactive.
Item {
  id: root
  property var bar: null
  property string text: ""
  property color foreground: "white"
  property bool dimmed: false
  property bool interactive: true
  property string tooltipText: ""

  signal pressed(int button)
  signal wheelMoved(int delta)

  implicitWidth: 18
  implicitHeight: 18
  anchors.verticalCenter: parent ? parent.verticalCenter : undefined

  MouseArea {
    anchors.fill: parent
    acceptedButtons: Qt.LeftButton | Qt.MiddleButton | Qt.RightButton
    onPressed: function(mouse) { if (root.interactive) root.pressed(mouse.button) }
    onWheel: function(wheel) { root.wheelMoved(wheel.angleDelta.y) }
  }
}
