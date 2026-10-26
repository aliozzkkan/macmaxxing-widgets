// System Controls: output volume, mute and display sleep through `system.controls`.
var CALL = "system.controls";

function apply(snapshot) {
  var volume = typeof snapshot.volume === "number" ? snapshot.volume : null;
  widget.setState({
    volume: volume === null ? 0 : volume,
    volumeText: volume === null ? "--" : "%" + volume,
    isMuted: snapshot.muted === true,
    notMuted: snapshot.muted !== true
  });
}

function fail(error) { console.log("system.controls failed: " + error.message); }

function refresh() {
  return host.call(CALL, "snapshot", {}).then(apply, function () {});
}

widget.onAction(function (name, payload) {
  if (name === "toggleMute" || name === "volumeUp" || name === "volumeDown" || name === "displaySleep") {
    host.call(CALL, name, {}).then(apply, fail);
  } else if (name === "setVolume") {
    host.call(CALL, "setVolume", { value: payload }).then(apply, fail);
  } else if (name === "openSound") {
    host.call("app.open", "openSystemSettings", { pane: "sound" }).then(function () {}, fail);
  }
});

widget.onVisible(function () { refresh(); });
refresh();
widget.every(widget.settings.refreshIntervalSeconds || 5, refresh);
