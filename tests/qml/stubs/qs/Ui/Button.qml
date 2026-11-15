import QtQuick

Rectangle {
  id: root
  property string text: ""
  property string iconText: ""
  property string tooltipText: ""
  property bool bordered: false
  property color foreground: "white"
  property real iconSize: 14
  property real horizontalPadding: 8

  signal clicked()

  implicitWidth: label.implicitWidth + horizontalPadding * 2
  implicitHeight: 24
  color: "transparent"

  Text {
    id: label
    anchors.centerIn: parent
    textFormat: Text.PlainText
    text: root.iconText + root.text
  }

  MouseArea {
    anchors.fill: parent
    onClicked: root.clicked()
  }
}
