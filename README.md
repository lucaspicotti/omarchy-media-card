# Media Card for the Omarchy bar

[Português](README.pt-BR.md)

What is playing, in the bar and one click away: the track in the bar in one of three styles, and a
card with the cover, the progress, the transport controls, the other players and the plugin's own
settings.

- **Three bar styles**, picked in the card's settings:
  - **Minimal**: an icon and "Artist — Track", cut at 28 characters;
  - **Controls**: the cover, the title and previous, play/pause, next;
  - **Icon** (the default): the cover, play/pause and a thin progress line. It takes the least room.
- **In the bar**: click opens the card, middle click plays or pauses, right click switches to the next
  player with a track, and the wheel sets that player's own volume, 5% a notch. Over the bar's buttons
  right and middle click do the same, so they never get in the way.
- **The card**: one tab per player (only with more than one), the cover (click plays or pauses), the
  title (click copies it), artist and album, the progress with both times, and shuffle, previous,
  play/pause, next and repeat (off → whole list → this track). An optional slider sets the player's
  volume, "Also playing" lists the other players with a button to switch, and "Open Spotify" (or the
  player's name) brings the player's window up.
- **Any MPRIS player**: Spotify, browsers, mpv, VLC… Players with no track are left out, and so is
  playerctld, which only mirrors another player. The bar follows the player that is playing; a
  player picked in a tab or with the right click stays until another one starts playing.
- **Side bars**: on a left or right bar the widget stacks down the bar, cover and play/pause only.
- **50 languages ready**: English and Português ship; others fall back to English, and the card
  follows the language picked under Setup > Language without a restart. Right-to-left languages
  read mirrored, with the transport controls and the times kept in order.

## Light on the system

Players are read from Quickshell's MPRIS list, which D-Bus keeps up to date: nothing is polled. The
position is asked for once a second, and only while it is on screen (the progress line or the open
card) and the track is moving. Covers are decoded at the size they are drawn. The plugin runs two
commands, and only when you ask: `wl-copy` when you copy a title, and `omarchy-bar set` when you
change a setting.

## Safe with what players send

Titles, artists and player names come from whichever program registered as a player. They are
always shown as plain text, never as markup. Covers are loaded only from `https://` or a local
`file://`, with no spaces or control characters and at most 2048 characters. Commands run as argument
lists, never through a shell.

## Install

```bash
omarchy plugin add https://github.com/lucaspicotti/omarchy-media-card --enable
```

Update with `omarchy plugin update lucaspicotti.media-card`. It sits next to the clock
(`centerEnd`); move it with `omarchy bar move lucaspicotti.media-card --section <section>`. Omarchy's
own media widget does the same job, so you may want `omarchy plugin disable omarchy.media`.

To open the card from the keyboard, add to `~/.config/hypr/bindings.lua`:

```lua
o.bind("SUPER + CTRL + M", "Media", { panel = "lucaspicotti.media-card" })
```

It opens only while something is playing.

## Remove

```bash
omarchy plugin remove lucaspicotti.media-card
```

The plugin writes nothing outside its folder except its settings, which live in its bar entry in
`~/.config/omarchy/shell.json`.

## Settings

Change them in the card (Settings, at the bottom) or with
`omarchy bar set lucaspicotti.media-card <setting> <value> --json`. They apply at once.

| Setting | Default | |
|---|---|---|
| `barStyle` | `"icon"` | `"minimal"`, `"controls"` or `"icon"`: see above |
| `hideWhenIdle` | `true` | the widget leaves the bar while no player has a track |
| `showVolume` | `false` | the player's volume slider in the card, for players that support it |
| `showOthers` | `true` | "Also playing" in the card; the tabs stay either way |

## Requirements

Omarchy with its Quickshell shell (tested with 4.5) and `wl-clipboard` for copying titles, both
part of a standard Omarchy install.

## Known limits

- Two players with the same name (two browser windows) get tabs with the same label.
- The volume is the player's own, not the system's; players that do not expose one ignore the wheel.
- If saving a setting fails (the widget is not on the bar), the switch simply does not change.
- Each monitor's bar keeps its own player choice.
- If a code change does not show after an update, run `omarchy restart shell`.

## Tests

```bash
npm test   # the model in Node; BarWidget.qml and MediaCard.qml driven with the mouse in qmltestrunner
```

The QML tests need `qt6-declarative`. They load the real widget and card over stand-ins for Omarchy's
`qs.Ui` and `qs.Commons` and for Quickshell (`tests/qml/stubs`); `tests/qml-stubs.test.js` checks
each stand-in against the Omarchy installed on the machine, so the tests cannot pass against an API
the shell does not have.

## License

MIT
