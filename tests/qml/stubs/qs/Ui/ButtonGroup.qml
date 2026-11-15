import QtQuick

// Like the real one: a row of chips that emits changed(value) only when a
// different option is picked.
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
      readonly property bool selected: optionValue === root.value
      width: 70
      height: 24
      color: "transparent"

      MouseArea {
        anchors.fill: parent
        onClicked: if (parent.optionValue !== root.value) root.changed(parent.optionValue)
      }
    }
  }
}
