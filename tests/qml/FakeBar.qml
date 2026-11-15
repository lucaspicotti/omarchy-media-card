import QtQuick

// The bar API a third-party widget receives (Omarchy's Ui/PluginBarApi.qml),
// with the two rules the plugin depends on: a tooltip only shows for a target
// whose tooltipHovered is true, and one popout at a time.
QtObject {
  property color foreground: "#d3c6aa"
  property color barForeground: "#d3c6aa"
  property color background: "#2d353b"
  property color urgent: "#e67e80"
  property string fontFamily: "monospace"
  property string position: "top"
  property bool vertical: false
  property int barSize: 26
  property var activePopout: null

  property string shownTooltip: ""

  function showTooltip(target, text) {
    shownTooltip = target && target.visible !== false && target.tooltipHovered === true && text ? text : ""
  }
  function hideTooltip(target) { shownTooltip = "" }

  function requestPopout(owner) {
    if (activePopout === owner) return
    if (activePopout && "close" in activePopout) activePopout.close()
    activePopout = owner
  }
  function releasePopout(owner) {
    if (activePopout === owner) activePopout = null
  }
}
