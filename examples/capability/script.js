// Capability example: one declared host capability, called with a literal name.
function refresh() {
  return host.call("system.timeMachine", "snapshot", {}).then(function (result) {
    if (!result) { return; }
    widget.setState({ hasData: true, summary: result.summary || "", caption: result.caption || "" });
  }, function () {});
}

widget.onVisible(refresh);
widget.onAction(function (name) {
  if (name === "refresh") { refresh(); }
});

refresh();
widget.every(widget.settings.refreshIntervalSeconds || 60, refresh);
