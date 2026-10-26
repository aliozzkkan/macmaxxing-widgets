// Current Power: turns `power.metrics` readings into view state. The host draws everything.
var latest = null;

function watts(value) { return typeof value === "number" ? value.toFixed(1) + " W" : "--"; }

function render() {
  if (!latest) { return; }
  var battery = latest.batteryWatts;
  var sign = typeof battery === "number" ? (battery > 0 ? "+" : (battery < 0 ? "-" : (latest.charging ? "+" : "-"))) : "";
  var level = latest.insight ? latest.insight.level : "";
  var density = widget.settings.density;
  widget.setState({
    primary: typeof battery === "number" ? sign + Math.abs(battery).toFixed(1) + " W" : "--",
    incomingText: watts(latest.incomingW),
    loadText: watts(latest.systemLoadW),
    batteryText: typeof latest.batteryPercent === "number" ? "%" + latest.batteryPercent : "--",
    batteryPercent: typeof latest.batteryPercent === "number" ? latest.batteryPercent : 0,
    timeRemaining: latest.timeRemaining,
    adapterName: latest.adapter ? latest.adapter.name : "--",
    flow: latest.flow || [],
    history: latest.history || [],
    insight: latest.insight ? {
      title: latest.insight.title, detail: latest.insight.detail, trend: latest.insight.trend || "",
      isGood: level === "good", isWarning: level === "warning", isCritical: level === "critical",
      isNeutral: level !== "good" && level !== "warning" && level !== "critical"
    } : { title: "", detail: "", trend: "", isGood: false, isWarning: false, isCritical: false, isNeutral: false },
    isDetailed: density === "detailed",
    isNotDetailed: density !== "detailed"
  });
}

function refresh() {
  return host.call("power.metrics", "snapshot", {}).then(function (snapshot) {
    latest = snapshot;
    render();
  }, function () {});
}

host.on("power.metrics", "changed", function (snapshot) {
  latest = snapshot;
  render();
});
widget.onSettings(function () { render(); refresh(); });
widget.onVisible(function () { refresh(); });
refresh();
widget.every(widget.settings.refreshIntervalSeconds || 10, refresh);
