// Internet Health — turns `network.health` into view state and starts or cancels a speed test.
// The host draws everything; the capability reports progress as events.
var latest = null;
var history = [];

function speed(value) {
  return (value >= 100 ? Math.round(value) : Math.round(value * 10) / 10) + " Mbps";
}

function render() {
  if (!latest) { return; }
  var testing = latest.isTesting === true;
  var offline = latest.status === "offline" && !testing;
  var hasPing = typeof latest.pingMs === "number";
  var headline = "";
  if (testing) {
    headline = speed(latest.progressMbps || 0);
  } else if (typeof latest.download === "number") {
    headline = speed(latest.download);
  } else if (hasPing) {
    headline = Math.round(latest.pingMs) + " ms";
  }
  widget.setState({
    isTesting: testing,
    isOffline: offline,
    isOnline: !testing && !offline,
    isGood: !testing && latest.status === "good",
    isSlow: !testing && latest.status === "slow",
    isWeak: !testing && latest.status === "weak",
    canTest: !testing,
    hasPing: hasPing,
    headline: headline,
    statusText: latest.statusText || "",
    pingText: hasPing ? latest.pingMs + " ms" : "--",
    lossText: typeof latest.loss === "number" ? latest.loss + "%" : "--",
    downloadText: typeof latest.download === "number" ? speed(latest.download) : "--",
    measuredText: latest.measuredText || "--",
    history: history
  });
}

function refresh() {
  return host.call("network.health", "snapshot", {}).then(function (result) {
    latest = result;
    if (typeof result.pingMs === "number") {
      history.push({ t: Date.now() / 1000, ping: result.pingMs });
      if (history.length > 30) { history.shift(); }
    }
    render();
  }, function () {});
}

host.on("network.health", "progress", function (payload) {
  if (!latest) { return; }
  latest.isTesting = payload.isTesting === true;
  if (typeof payload.progressMbps === "number") { latest.progressMbps = payload.progressMbps; }
  render();
  // The test ended: read the new result.
  if (!latest.isTesting) { refresh(); }
});

widget.onVisible(refresh);
widget.onAction(function (name) {
  if (name === "startSpeedTest") {
    host.call("network.health", "startSpeedTest", {}).then(refresh, function () {});
  } else if (name === "cancelSpeedTest") {
    host.call("network.health", "cancelSpeedTest", {}).then(refresh, function () {});
  }
});

refresh();
widget.every(widget.settings.refreshIntervalSeconds || 10, refresh);
