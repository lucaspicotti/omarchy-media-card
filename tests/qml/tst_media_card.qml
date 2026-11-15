import QtQuick
import QtTest
import Quickshell
import Quickshell.Services.Mpris

// Loads the real BarWidget.qml, which builds the real MediaCard.qml, over the
// stand-ins in stubs/, and drives both with the mouse.
TestCase {
  id: testCase
  name: "MediaCard"
  when: windowShown
  width: 900
  height: 1000
  // TestCase is invisible by default; the widget and the card need a visible
  // parent to take clicks.
  visible: true

  Component { id: playerComponent; FakePlayer {} }
  Component { id: barComponent; FakeBar {} }
  readonly property Component widgetComponent: Qt.createComponent(Qt.resolvedUrl("../../BarWidget.qml"))

  property var widget: null
  property var spotify: null
  property var chrome: null

  function makePlayer(props) {
    return createTemporaryObject(playerComponent, testCase, props)
  }

  function init() {
    Quickshell.executed = []
    spotify = makePlayer({
      dbusName: "org.mpris.MediaPlayer2.spotify", identity: "Spotify", isPlaying: true,
      trackTitle: "Maria Tambiên", trackArtist: "Khruangbin", trackAlbum: "Con Todo El Mundo",
      position: 112, length: 194
    })
    chrome = makePlayer({
      dbusName: "org.mpris.MediaPlayer2.chromium.instance1", identity: "Chromium",
      trackTitle: "Vídeo do YouTube", trackArtist: "youtube.com"
    })
    Mpris.players.values = [spotify]
    compare(widgetComponent.status, Component.Ready, widgetComponent.errorString())
    widget = createTemporaryObject(widgetComponent, testCase, { bar: createTemporaryObject(barComponent, testCase) })
    verify(widget, "BarWidget.qml carregou")
    verify(widget.visible, "o widget aparece com mídia")
  }

  function cleanup() {
    Mpris.players.values = []
  }

  // ------------------------------------------------------------- helpers
  // Column and Row place their children at the next polish, before the frame
  // is drawn; until then every child of the card sits at the same spot. In
  // the shell a frame always comes before a click, so let one pass here too.
  function settle() {
    wait(20)
  }

  function findAll(item, predicate, found) {
    found = found || []
    if (!item) return found
    if (predicate(item)) found.push(item)
    var kids = item.children || []
    for (var i = 0; i < kids.length; i++) findAll(kids[i], predicate, found)
    return found
  }

  function find(item, predicate) {
    var found = findAll(item, predicate)
    return found.length > 0 ? found[0] : null
  }

  function card() {
    settle()
    return find(widget, function(item) { return item.settingsShown !== undefined })
  }

  function shownText(text) {
    return find(card(), function(item) { return item.visible && item.textFormat !== undefined && item.text === text })
  }

  // A Button of the card by its tooltip or its text, only while visible.
  function cardButton(label) {
    return find(card(), function(item) {
      return item.visible && item.iconText !== undefined && (item.tooltipText === label || item.text === label)
    })
  }

  function toggle(label) {
    return find(card(), function(item) { return item.visible && item.label === label && item.checked !== undefined })
  }

  function chip(value) {
    return find(card(), function(item) { return item.visible && item.optionValue === value })
  }

  function slider() {
    return find(card(), function(item) { return item.visible && item.moved !== undefined && item.value !== undefined && item.iconText === undefined })
  }

  // The widget's own margin, left of the cover and the buttons, so a click
  // lands on the widget's MouseArea and not on a transport button.
  function clickWidget(button) {
    mouseClick(widget, 2, widget.height / 2, button || Qt.LeftButton)
  }

  function wheelWidget(delta) {
    mouseWheel(widget, 2, widget.height / 2, 0, delta)
  }

  function openCard() {
    clickWidget()
    verify(card().visible, "o card abriu")
  }

  function openSettings() {
    openCard()
    mouseClick(cardButton("Settings"))
  }

  function endMedia() {
    spotify.trackTitle = ""
    spotify.trackArtist = ""
  }

  // The argv that saves one setting, as settingCommand builds it.
  function saveCommand(key, json) {
    return JSON.stringify(["omarchy-bar", "set", "lucaspicotti.media-card", key, json, "--json"])
  }

  function lastCommand() {
    return Quickshell.executed.length > 0 ? JSON.stringify(Quickshell.executed[Quickshell.executed.length - 1]) : ""
  }

  // ----------------------------------------------------------------- bar
  function test_left_click_opens_and_closes_the_card() {
    verify(!card().visible)
    clickWidget()
    verify(card().visible)
    clickWidget()
    verify(!card().visible)
  }

  function test_middle_click_plays_or_pauses_without_opening() {
    clickWidget(Qt.MiddleButton)
    compare(spotify.isPlaying, false)
    verify(!card().visible)
  }

  function test_right_click_switches_to_the_next_player() {
    Mpris.players.values = [spotify, chrome]
    clickWidget(Qt.RightButton)
    compare(widget.activePlayer, chrome)
    clickWidget(Qt.RightButton)
    compare(widget.activePlayer, spotify)
  }

  function test_wheel_changes_the_player_volume() {
    wheelWidget(120)
    compare(spotify.volume, 0.55)
    wheelWidget(-240)
    compare(spotify.volume, 0.5)
  }

  function test_wheel_leaves_a_player_without_volume_alone() {
    spotify.volumeSupported = false
    wheelWidget(120)
    compare(spotify.volume, 0.5)
  }

  // The default style shows one bar button, play/pause; the wheel over it
  // must reach the player too, not only the widget's own margin.
  function test_wheel_over_a_bar_button_changes_the_volume() {
    var button = find(widget, function(item) { return item.visible && item.wheelMoved !== undefined })
    verify(button)
    mouseWheel(button, button.width / 2, button.height / 2, 0, 120)
    compare(spotify.volume, 0.55)
  }

  function test_summon_opens_only_with_media() {
    widget.open()
    verify(card().visible)
    verify(widget.opened)
    widget.close()
    endMedia()
    widget.open()
    verify(!widget.opened)
  }

  function test_card_closes_when_the_media_ends_and_stays_closed() {
    openCard()
    endMedia()
    verify(!card().visible)
    spotify.trackTitle = "Próxima faixa"
    verify(!card().visible)
  }

  // ---------------------------------------------------------------- card
  function test_card_shows_the_track_and_the_times() {
    openCard()
    verify(shownText("Maria Tambiên"))
    verify(shownText("Khruangbin"))
    verify(shownText("Con Todo El Mundo"))
    verify(shownText("1:52"))
    verify(shownText("3:14"))
  }

  function test_track_text_from_the_player_stays_plain_text() {
    spotify.trackTitle = "<img src=\"https://example.invalid/t.png\">"
    openCard()
    var title = shownText(spotify.trackTitle)
    verify(title)
    compare(title.textFormat, Text.PlainText)
  }

  function test_transport_buttons_reach_the_player() {
    openCard()
    mouseClick(cardButton("Next"))
    compare(spotify.nextCalls, 1)
    mouseClick(cardButton("Previous"))
    compare(spotify.previousCalls, 1)
    mouseClick(cardButton("Pause"))
    compare(spotify.isPlaying, false)
    verify(cardButton("Play"), "o botão passa a tocar")
  }

  function test_buttons_the_player_cannot_use_do_nothing() {
    spotify.canGoNext = false
    openCard()
    var next = cardButton("Next")
    verify(!next.enabled)
    mouseClick(next)
    compare(spotify.nextCalls, 0)
  }

  function test_shuffle_and_repeat() {
    openCard()
    mouseClick(cardButton("Shuffle"))
    compare(spotify.shuffle, true)
    var repeat = cardButton("Repeat")
    mouseClick(repeat)
    compare(spotify.loopState, 2)
    compare(repeat.tooltipText, "Repeating the list")
    mouseClick(repeat)
    compare(spotify.loopState, 1)
    mouseClick(repeat)
    compare(spotify.loopState, 0)
  }

  function test_cover_plays_or_pauses() {
    openCard()
    var cover = find(card(), function(item) { return item.visible && item.url !== undefined && item.width >= 100 && item.radius !== undefined })
    verify(cover)
    mouseClick(cover)
    compare(spotify.isPlaying, false)
  }

  function test_title_click_copies_it() {
    openCard()
    mouseClick(shownText("Maria Tambiên"))
    compare(lastCommand(), JSON.stringify(["wl-copy", "--", "Maria Tambiên"]))
  }

  function test_open_raises_the_player_and_closes_the_card() {
    openCard()
    mouseClick(cardButton("Open Spotify"))
    compare(spotify.raiseCalls, 1)
    verify(!card().visible)
  }

  function test_open_is_hidden_when_the_player_cannot_raise() {
    spotify.canRaise = false
    openCard()
    verify(!cardButton("Open Spotify"))
  }

  // ------------------------------------------------------------- players
  function test_one_player_has_no_tabs_and_no_others() {
    openCard()
    verify(!chip(spotify.dbusName))
    verify(!shownText("Also playing"))
  }

  function test_tabs_switch_the_player_shown() {
    Mpris.players.values = [spotify, chrome]
    openCard()
    mouseClick(chip(chrome.dbusName))
    compare(widget.activePlayer, chrome)
    verify(shownText("Vídeo do YouTube"))
  }

  function test_players_without_a_track_get_no_tab_and_are_not_listed() {
    var idle = makePlayer({ dbusName: "org.mpris.MediaPlayer2.vlc", identity: "VLC" })
    Mpris.players.values = [spotify, idle]
    openCard()
    verify(!chip(idle.dbusName))
    verify(!shownText("Also playing"))
  }

  function test_also_playing_lists_and_switches_to_the_others() {
    Mpris.players.values = [spotify, chrome]
    openCard()
    verify(shownText("Also playing"))
    verify(shownText("Chromium · paused"))
    mouseClick(cardButton("Switch to this player"))
    compare(widget.activePlayer, chrome)
  }

  function test_also_playing_follows_its_setting() {
    Mpris.players.values = [spotify, chrome]
    widget.settings = { showOthers: false }
    openCard()
    verify(!shownText("Also playing"))
    verify(chip(chrome.dbusName), "as abas continuam")
  }

  // -------------------------------------------------------------- volume
  function test_volume_slider_needs_the_setting() {
    openCard()
    verify(!slider())
    widget.settings = { showVolume: true }
    verify(slider())
    slider().moved(0.3)
    compare(spotify.volume, 0.3)
  }

  function test_volume_slider_needs_a_player_with_volume() {
    spotify.volumeSupported = false
    widget.settings = { showVolume: true }
    openCard()
    verify(!slider())
  }

  // ------------------------------------------------------------ settings
  function test_settings_screen_replaces_the_player_and_goes_back() {
    openSettings()
    verify(shownText("Media · Settings"))
    verify(!shownText("Maria Tambiên"))
    mouseClick(cardButton("Back"))
    verify(shownText("Maria Tambiên"))
  }

  function test_settings_screen_resets_when_the_card_closes() {
    openSettings()
    clickWidget()
    clickWidget()
    verify(shownText("Maria Tambiên"))
  }

  function test_toggles_save_the_opposite_value() {
    openSettings()
    mouseClick(toggle("Show player volume"))
    compare(lastCommand(), saveCommand("showVolume", "true"))
    mouseClick(toggle("Hide when nothing plays"))
    compare(lastCommand(), saveCommand("hideWhenIdle", "false"))
    mouseClick(toggle("Show \"Also playing\""))
    compare(lastCommand(), saveCommand("showOthers", "false"))
  }

  function test_toggles_show_the_saved_settings() {
    widget.settings = { showVolume: true, hideWhenIdle: false, showOthers: false }
    openSettings()
    compare(toggle("Show player volume").checked, true)
    compare(toggle("Hide when nothing plays").checked, false)
    compare(toggle("Show \"Also playing\"").checked, false)
  }

  function test_bar_style_saves_the_chosen_style() {
    openSettings()
    verify(shownText("Cover, play/pause and a progress line. Takes the least room."))
    mouseClick(chip("controls"))
    compare(lastCommand(), saveCommand("barStyle", "\"controls\""))
    mouseClick(chip("icon"))
    compare(Quickshell.executed.length, 1, "o estilo atual não grava de novo")
  }
}
