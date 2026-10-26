// Time Machine — turns `system.timeMachine` into view state. The host draws everything.
var latest = null;

function render() {
  if (!latest) { return; }
  var running = latest.status === "running";
  widget.setState({
    hasData: true,
    isRunning: running,
    isOk: latest.status === "ok",
    isNone: latest.status === "noBackup",
    summary: latest.summary || "",
    caption: latest.caption || "",
    statusText: latest.statusText || "",
    hasLast: !!latest.lastBackup,
    lastBackupText: latest.lastBackupText || "",
    hasNext: !!latest.nextBackup,
    nextBackup: latest.nextBackup || 0,
    hasDestination: !!latest.destination,
    destination: latest.destination || "",
    hasProgress: running && typeof latest.progress === "number",
    progress: latest.progress || 0
  });
}

function refresh() {
  return host.call("system.timeMachine", "snapshot", {}).then(function (result) {
    latest = result;
    render();
  }, function () {});
}

widget.onVisible(refresh);
widget.onAction(function (name) {
  if (name === "openSettings") {
    host.call("app.open", "openSystemSettings", { pane: "timeMachine" }).then(function () {}, function () {});
  }
});

refresh();
widget.every(widget.settings.refreshIntervalSeconds || 30, refresh);
