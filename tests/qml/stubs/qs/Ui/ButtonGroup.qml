import QtQuick

// Like the real one: a row of chips that emits changed(value) on every click,
// the selected chip included.
Row {
  id: root
  property var options: []
  property string value: ""
  property color foreground: "white"
  property color accent: "teal"
  property bool focusable: true

  signal changed(string value)

  spacing: 4

  Repeater {
    model: root.options

    Rectangle {
      required property var modelData
      readonly property string optionValue: modelData.value
      readonly property string optionLabel: modelData.label
      width: 70
      height: 24
      color: "transparent"

      MouseArea {
        anchors.fill: parent
        onClicked: root.changed(parent.optionValue)
      }
    }
  }
}
