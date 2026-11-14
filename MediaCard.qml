import QtQuick
import Quickshell
import qs.Ui
import qs.Commons
import qs.Commons as Commons
import "MediaCardModel.js" as Model

// The card the bar widget opens (design 2C), with the plugin's settings on a
// second screen (design 3). Like BarWidget.qml it only draws what
// MediaCardModel.js decides; `widget` is the BarWidget that owns the card and
// holds the player, the settings and the transport actions.
PopupCard {
  id: card

  required property Item widget

  readonly property var player: widget.activePlayer
  readonly property var config: widget.config
  readonly property var controls: widget.controls
  readonly property var track: widget.track

  // Only players with a track: activePlayer skips the others, so a tab for
  // one of them would do nothing.
  readonly property var players: Model.mediaPlayers(card.widget.players)
  readonly property string shownKey: Model.playerKey(player)
  readonly property var tabs: Model.tabsFor(card.players, card.shownKey)
  readonly property var others: Model.otherPlayers(card.players, card.shownKey, card.config.showOthers)

  readonly property color fg: bar ? bar.foreground : Commons.Color.foreground
  readonly property color dim: Qt.darker(fg, 1.4)
  readonly property color accent: Commons.Color.accent

  readonly property Commons.Translations strings: Commons.Translations {
    directory: Qt.resolvedUrl("i18n")
  }

  // The settings screen replaces the player until the card closes.
  property bool settingsShown: false
  onOpenChanged: if (!open) settingsShown = false

  contentWidth: fittedContentWidth(Style.space(360))
  contentHeight: fittedContentHeight(settingsShown ? settingsView.implicitHeight : playerView.implicitHeight)

  function save(key, value) {
    var argv = Model.settingCommand(key, value)
    if (argv.length > 0) Quickshell.execDetached(argv)
  }

  function copyTitle() {
    if (card.track.title !== "") Quickshell.execDetached(["wl-copy", "--", card.track.title])
  }

  function raisePlayer() {
    if (!card.controls.enabled.raise) return
    card.player.raise()
    card.close()
  }

  function toggleShuffle() {
    if (card.controls.enabled.shuffle) card.player.shuffle = !card.player.shuffle
  }

  function cycleRepeat() {
    if (card.controls.enabled.repeat) card.player.loopState = Model.nextLoopState(card.player.loopState)
  }

  component PlainLabel: Text {
    textFormat: Text.PlainText
    color: card.fg
    font.family: Style.font.family
    font.pixelSize: Style.font.body
    elide: Text.ElideRight
  }

  component CoverArt: BorderSurface {
    property url url: ""
    radius: Style.spacing.labelGap
    color: Style.normalFillFor(card.fg, card.accent)
    borderSpec: Border.controlSpec("normal", card.fg, card.accent)

    // Decoded at the size it is drawn, not the size the player serves it at.
    SizedImage {
      anchors.fill: parent
      anchors.margins: Style.space(2)
      crop: true
      url: parent.url
      visible: url != ""
    }

    Text {
      textFormat: Text.PlainText
      anchors.centerIn: parent
      visible: parent.url == ""
      text: "󰝚"
      color: card.fg
      font.family: Style.font.family
      font.pixelSize: Math.round(parent.height * 0.4)
    }
  }

  component CardButton: Button {
    property bool available: true
    foreground: card.fg
    enabled: available
    opacity: available ? 1 : 0.4
  }

  // ------------------------------------------------------------ player view
  Column {
    id: playerView
    visible: !card.settingsShown
    width: parent.width
    spacing: Style.space(12)

    // One tab per player, only with more than one.
    ButtonGroup {
      visible: card.tabs.length > 0
      width: parent.width
      focusable: false
      foreground: card.fg
      accent: card.accent
      options: card.tabs.map(function(tab) { return { value: tab.key, label: tab.label } })
      value: card.shownKey
      onChanged: function(value) { card.widget.preferredKey = value }
    }

    Row {
      width: parent.width
      spacing: Style.space(14)

      // The cover plays or pauses, as in the design.
      CoverArt {
        id: cover
        width: Style.space(128)
        height: width
        url: card.track.artUrl

        MouseArea {
          anchors.fill: parent
          cursorShape: Qt.PointingHandCursor
          enabled: card.controls.enabled.playPause
          onClicked: card.widget.playPause()
        }
      }

      Column {
        width: parent.width - cover.width - parent.spacing
        anchors.verticalCenter: parent.verticalCenter
        spacing: Style.space(4)

        PlainLabel {
          width: parent.width
          text: card.track.title
          font.pixelSize: Style.font.subtitle
          font.bold: true
          wrapMode: Text.Wrap
          maximumLineCount: 2

          MouseArea {
            anchors.fill: parent
            cursorShape: Qt.IBeamCursor
            hoverEnabled: true
            onClicked: card.copyTitle()
            onEntered: if (card.bar) card.bar.showTooltip(parent, card.strings.t("card.copyTitle"))
            onExited: if (card.bar) card.bar.hideTooltip(parent)
          }
        }

        PlainLabel {
          width: parent.width
          visible: text !== ""
          text: card.track.artist
          color: card.dim
          font.pixelSize: Style.font.bodySmall
        }

        PlainLabel {
          width: parent.width
          visible: text !== ""
          text: card.track.album
          color: card.dim
          font.pixelSize: Style.font.bodySmall
        }
      }
    }

    Column {
      width: parent.width
      spacing: Style.space(4)

      Rectangle {
        width: parent.width
        height: Math.max(2, Style.space(4))
        radius: height / 2
        color: Qt.darker(card.fg, 2.6)

        Rectangle {
          width: parent.width * card.widget.progress
          height: parent.height
          radius: parent.radius
          color: card.accent
        }
      }

      Item {
        width: parent.width
        height: position.implicitHeight
        // Times read left to right in every language, like the progress line.
        LayoutMirroring.enabled: false

        PlainLabel {
          id: position
          anchors.left: parent.left
          text: Model.formatTime(card.player ? card.player.position : 0)
          color: card.dim
          font.pixelSize: Style.font.caption
        }

        PlainLabel {
          anchors.right: parent.right
          text: Model.formatTime(card.player ? card.player.length : 0)
          color: card.dim
          font.pixelSize: Style.font.caption
        }
      }
    }

    Row {
      anchors.horizontalCenter: parent.horizontalCenter
      spacing: Style.space(8)
      // Transport controls keep their order in right-to-left languages.
      LayoutMirroring.enabled: false
      LayoutMirroring.childrenInherit: true

      CardButton {
        anchors.verticalCenter: parent.verticalCenter
        available: card.controls.enabled.shuffle
        iconText: card.controls.shuffleOn ? "󰒝" : "󰒞"
        foreground: card.controls.shuffleOn ? card.accent : card.fg
        tooltipText: card.strings.t("card.shuffle")
        onClicked: card.toggleShuffle()
      }

      CardButton {
        anchors.verticalCenter: parent.verticalCenter
        available: card.controls.enabled.previous
        iconText: "󰒮"
        tooltipText: card.strings.t("card.previous")
        onClicked: card.widget.previous()
      }

      CardButton {
        anchors.verticalCenter: parent.verticalCenter
        available: card.controls.enabled.playPause
        iconText: card.controls.playing ? "󰏤" : "󰐊"
        iconSize: Style.font.iconLarge
        horizontalPadding: Style.spacing.panelGap
        foreground: card.accent
        bordered: true
        tooltipText: card.controls.playing ? card.strings.t("card.pause") : card.strings.t("card.play")
        onClicked: card.widget.playPause()
      }

      CardButton {
        anchors.verticalCenter: parent.verticalCenter
        available: card.controls.enabled.next
        iconText: "󰒭"
        tooltipText: card.strings.t("card.next")
        onClicked: card.widget.next()
      }

      CardButton {
        anchors.verticalCenter: parent.verticalCenter
        available: card.controls.enabled.repeat
        iconText: card.controls.repeatMode === "track" ? "󰑘" : card.controls.repeatMode === "playlist" ? "󰑖" : "󰑗"
        foreground: card.controls.repeatMode === "none" ? card.fg : card.accent
        tooltipText: card.controls.repeatMode === "track" ? card.strings.t("card.repeatTrack")
          : card.controls.repeatMode === "playlist" ? card.strings.t("card.repeatPlaylist")
          : card.strings.t("card.repeat")
        onClicked: card.cycleRepeat()
      }
    }

    // The player's own volume, off by default (Settings).
    Row {
      visible: card.config.showVolume && card.controls.enabled.volume
      width: parent.width
      spacing: Style.space(10)

      PlainLabel {
        id: volumeIcon
        anchors.verticalCenter: parent.verticalCenter
        text: "󰕾"
        color: card.dim
      }

      PanelSlider {
        anchors.verticalCenter: parent.verticalCenter
        width: parent.width - volumeIcon.width - parent.spacing
        bar: card.bar
        value: card.player ? card.player.volume : 0
        onMoved: function(value) { if (card.player) card.player.volume = value }
      }
    }

    Column {
      visible: card.others.length > 0
      width: parent.width
      spacing: Style.space(8)

      PanelSeparator {
        foreground: card.fg
      }

      PanelSectionHeader {
        text: card.strings.t("card.alsoPlaying")
        foreground: card.dim
      }

      Repeater {
        model: card.others

        Row {
          id: otherRow
          required property var modelData
          width: parent.width
          spacing: Style.space(10)

          CoverArt {
            id: otherCover
            anchors.verticalCenter: parent.verticalCenter
            width: Style.space(36)
            height: width
            url: otherRow.modelData.artUrl
          }

          Column {
            anchors.verticalCenter: parent.verticalCenter
            width: parent.width - otherCover.width - switchButton.width - parent.spacing * 2
            spacing: Style.space(1)

            PlainLabel {
              width: parent.width
              text: otherRow.modelData.title
              font.pixelSize: Style.font.bodySmall
            }

            PlainLabel {
              width: parent.width
              text: card.strings.t("card.playerState").arg(otherRow.modelData.label).arg(otherRow.modelData.state === "playing"
                ? card.strings.t("state.playing") : card.strings.t("state.paused"))
              color: card.dim
              font.pixelSize: Style.font.caption
            }
          }

          CardButton {
            id: switchButton
            anchors.verticalCenter: parent.verticalCenter
            iconText: "󰐊"
            tooltipText: card.strings.t("card.switchTo")
            onClicked: card.widget.preferredKey = otherRow.modelData.key
          }
        }
      }
    }

    Item {
      width: parent.width
      height: Math.max(openButton.implicitHeight, settingsButton.implicitHeight)

      CardButton {
        id: openButton
        anchors.left: parent.left
        visible: card.controls.enabled.raise
        text: card.strings.t("card.open").arg(Model.playerLabel(card.player))
        foreground: card.accent
        onClicked: card.raisePlayer()
      }

      CardButton {
        id: settingsButton
        anchors.right: parent.right
        text: card.strings.t("card.settings")
        foreground: card.dim
        onClicked: card.settingsShown = true
      }
    }
  }

  // ---------------------------------------------------------- settings view
  // Each change is saved to shell.json at once; the bar hands the new settings
  // back to the widget live, so nothing here keeps its own copy.
  Column {
    id: settingsView
    visible: card.settingsShown
    width: parent.width
    spacing: Style.space(12)

    Row {
      spacing: Style.space(8)

      CardButton {
        anchors.verticalCenter: parent.verticalCenter
        iconText: Commons.I18n.rightToLeft ? "󰁔" : "󰁍"
        tooltipText: card.strings.t("settings.back")
        onClicked: card.settingsShown = false
      }

      PlainLabel {
        anchors.verticalCenter: parent.verticalCenter
        text: card.strings.t("settings.title")
        font.pixelSize: Style.font.subtitle
        font.bold: true
      }
    }

    PlainLabel {
      width: parent.width
      text: card.strings.t("settings.subtitle")
      color: card.dim
      font.pixelSize: Style.font.caption
      wrapMode: Text.Wrap
    }

    PanelSectionHeader {
      text: card.strings.t("settings.bar")
      foreground: card.dim
    }

    ButtonGroup {
      width: parent.width
      focusable: false
      foreground: card.fg
      accent: card.accent
      options: [
        { value: "minimal", label: card.strings.t("style.minimal") },
        { value: "controls", label: card.strings.t("style.controls") },
        { value: "icon", label: card.strings.t("style.icon") }
      ]
      value: card.config.barStyle
      onChanged: function(value) { card.save("barStyle", value) }
    }

    PlainLabel {
      width: parent.width
      wrapMode: Text.Wrap
      color: card.dim
      font.pixelSize: Style.font.caption
      text: card.config.barStyle === "minimal" ? card.strings.t("style.minimalDescription")
        : card.config.barStyle === "controls" ? card.strings.t("style.controlsDescription")
        : card.strings.t("style.iconDescription")
    }

    Toggle {
      width: parent.width
      foreground: card.fg
      accent: card.accent
      label: card.strings.t("settings.hideWhenIdle")
      description: card.strings.t("settings.hideWhenIdleDescription")
      checked: card.config.hideWhenIdle
      onClicked: card.save("hideWhenIdle", !card.config.hideWhenIdle)
    }

    PanelSectionHeader {
      text: card.strings.t("settings.card")
      foreground: card.dim
    }

    Toggle {
      width: parent.width
      foreground: card.fg
      accent: card.accent
      label: card.strings.t("settings.showVolume")
      description: card.strings.t("settings.showVolumeDescription")
      checked: card.config.showVolume
      onClicked: card.save("showVolume", !card.config.showVolume)
    }

    Toggle {
      width: parent.width
      foreground: card.fg
      accent: card.accent
      label: card.strings.t("settings.showOthers")
      description: card.strings.t("settings.showOthersDescription")
      checked: card.config.showOthers
      onClicked: card.save("showOthers", !card.config.showOthers)
    }
  }
}
