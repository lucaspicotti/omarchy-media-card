import QtQuick
import qs.Commons as Commons

// The real card is a PopupWindow under the bar; here it is an item just below
// the widget, so the test window holds both and clicks reach either. Like the
// real one it claims the bar's single popout while open and reads mirrored in
// right-to-left languages.
Item {
  id: root
  required property Item anchorItem
  required property QtObject bar
  property var owner: null
  property int padding: 12
  property int contentWidth: 280
  property int contentHeight: 200
  property bool open: false

  function fittedContentWidth(width, cap) { return Math.round(Math.max(1, Number(width) || 1)) }
  function fittedContentHeight(implicitHeight, cap) { return Math.round((Number(implicitHeight) || 0) + padding * 2) }
  function close() {
    if (owner && "close" in owner) owner.close()
    else root.open = false
  }

  default property alias contentItem: contentHolder.children

  onOpenChanged: {
    if (!bar) return
    if (open) bar.requestPopout(owner || root)
    else if (bar.activePopout === (owner || root)) bar.releasePopout(owner || root)
  }

  visible: open
  y: anchorItem ? anchorItem.height + 4 : 0
  width: contentWidth
  height: contentHeight

  Item {
    id: contentHolder
    anchors.fill: parent
    anchors.margins: root.padding
    LayoutMirroring.enabled: Commons.I18n.rightToLeft
    LayoutMirroring.childrenInherit: true
  }
}
