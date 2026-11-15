pragma Singleton
import QtQuick

QtObject {
  // Copied from Omarchy's Commons/Util.qml: one event is at most one step,
  // and touchpad deltas add up until they make a notch.
  function wheelSteps(accumulator, delta) {
    delta = Math.max(-120, Math.min(120, delta))
    if (accumulator * delta < 0) accumulator = 0
    var total = accumulator + delta
    var steps = total < 0 ? Math.ceil(total / 120) : Math.floor(total / 120)
    return { steps: steps, remainder: total - steps * 120 }
  }
}
