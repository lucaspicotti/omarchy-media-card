import QtQuick

// The parts of Omarchy's bar (plugins/bar/Bar.qml) that the widget and the
// card read, with the same names.
QtObject {
  property color foreground: "#d3c6aa"
  property color barForeground: "#d3c6aa"
  property string fontFamily: "monospace"
  readonly property int barSize: 26
  property string tooltipText: ""

  function showTooltip(target, text) { tooltipText = text }
  function hideTooltip(target) { tooltipText = "" }
}
