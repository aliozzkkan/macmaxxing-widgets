// Device Batteries — turns `devices.batteries` into view state. The host draws everything.
var latest = null;

function render() {
  if (!latest) { return; }
  var ok = latest.status === "ok";
  var devices = latest.devices || [];
  var lowest = null;
  devices.forEach(function (device) {
    if (!lowest || device.percent < lowest.percent) { lowest = device; }
  });
  var caption = latest.caption || "";
  widget.setState({
    isReady: ok && devices.length > 0,
    isEmpty: ok && devices.length === 0,
    isUnavailable: !ok,
    hasLow: ok && devices.length > 0 && caption !== "",
    allGood: ok && devices.length > 0 && caption === "",
    summary: latest.summary || "",
    caption: caption,
    lowText: caption,
    lowest: lowest ? { name: lowest.name, percent: lowest.percent, valueText: lowest.valueText } : null,
    rows: devices.slice(0, 12).map(function (device) {
      var row = { title: device.name, value: device.valueText };
      if (device.note) { row.detail = device.note; }
      return row;
    }),
    chart: devices.map(function (device) { return { label: device.name, value: device.percent }; })
  });
}

// While the dashboard is hidden the host stops the capability and calls fail; the card keeps
// its last state and the next call after the panel opens refreshes it.
function refresh() {
  return host.call("devices.batteries", "snapshot", {}).then(function (result) {
    latest = result;
    render();
  }, function () {});
}

widget.onVisible(refresh);
refresh();
widget.every(widget.settings.refreshIntervalSeconds || 30, refresh);
