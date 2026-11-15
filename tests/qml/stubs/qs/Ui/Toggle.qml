import QtQuick

Rectangle {
  id: root
  property string label: ""
  property string description: ""
  property bool checked: false
  property color foreground: "white"
  property color accent: "teal"

  signal clicked()

  implicitHeight: 40
  color: "transparent"

  MouseArea {
    anchors.fill: parent
    onClicked: root.clicked()
  }
}
