// System Health — turns `system.health` readings into view state. The host draws everything.
var METRICS = ["cpu", "memory", "gpu", "disk"];
var ROW_SETTINGS = {
  cpu: "showCPU",
  memory: "showMemory",
  gpu: "showGPU",
  disk: "showDisk",
  network: "showNetwork",
  thermal: "showThermal",
  uptime: "showUptime"
};
var latest = null;

function isShown(id, settings) {
  var key = ROW_SETTINGS[id];
  return !key || settings[key] !== false;
}

// The most loaded resource, and the most pressured one (highest severity, then load).
function rank(measured) {
  var peak = null;
  var pressure = null;
  measured.forEach(function (metric) {
    if (!peak || metric.value > peak.value) { peak = metric; }
    if (metric.severity > 0 && (!pressure || metric.severity > pressure.severity ||
        (metric.severity === pressure.severity && metric.value > pressure.value))) {
      pressure = metric;
    }
  });
  return { peak: peak, pressure: pressure };
}

// The rows the user shows; the capability rates status and alerts on these only.
function shownRows(settings) {
  return Object.keys(ROW_SETTINGS).filter(function (id) { return isShown(id, settings); });
}

function render() {
  if (!latest) { return; }
  var settings = widget.settings;
  var measured = METRICS.map(function (id) {
    var metric = latest[id] || {};
    return { id: id, label: metric.label, text: metric.text, value: metric.value, severity: metric.severity || 0 };
  }).filter(function (metric) {
    return typeof metric.value === "number" && isShown(metric.id, settings);
  });
  var ranked = rank(measured);
  var network = latest.network || {};
  var networkRow = (latest.rows || []).filter(function (row) { return row.id === "network"; })[0];
  var networkMeasured = !!(networkRow && networkRow.detail);
  var isCritical = latest.status === "critical";
  var isWarning = latest.status === "warning";
  var isMeasuring = !isCritical && !isWarning && measured.length === 0;
  var thermal = latest.thermal || {};
  var uptime = latest.uptime || {};
  var footer = [];
  if (isShown("thermal", settings) && thermal.label) { footer.push(thermal.label); }
  if (isShown("uptime", settings) && uptime.label) { footer.push(uptime.label); }

  widget.setState({
    cpu: latest.cpu,
    memory: latest.memory,
    gpu: latest.gpu,
    disk: latest.disk,
    thermal: thermal,
    uptime: uptime,
    footer: footer.join(" · "),
    network: {
      down: network.down,
      up: network.up,
      downText: networkMeasured ? "↓ " + network.down : network.down,
      upText: networkMeasured ? "↑ " + network.up : "",
      upLabel: " "
    },
    rows: (latest.rows || []).filter(function (row) { return isShown(row.id, settings); }),
    history: latest.history || [],
    summary: latest.summary,
    secondary: latest.secondary,
    status: latest.status,
    peak: ranked.peak ? { label: ranked.peak.label, text: ranked.peak.text } : null,
    pressure: { label: ranked.pressure ? ranked.pressure.label : (thermal.title || "") },
    isOk: !isCritical && !isWarning && !isMeasuring,
    isWarning: isWarning,
    isCritical: isCritical,
    isMeasuring: isMeasuring
  });
}

// While the dashboard is hidden the host stops the capability and calls fail; the card keeps
// its last state and the next call after the panel opens refreshes it, so failures stay quiet.
function refresh() {
  return host.call("system.health", "snapshot", { shown: shownRows(widget.settings) }).then(function (snapshot) {
    latest = snapshot;
    render();
  }, function () {});
}

// A failed opt-in (for example at launch, before the dashboard was ever shown) is re-sent from
// widget.onVisible; it is logged once so a real problem is still visible.
var alertsFailureLogged = false;
function syncAlerts() {
  var settings = widget.settings;
  return host.call("system.health", "setAlerts", { enabled: settings.alerts === true, shown: shownRows(settings) })
    .then(function () { alertsFailureLogged = false; }, function (error) {
      if (!alertsFailureLogged) {
        alertsFailureLogged = true;
        console.log("setAlerts failed (re-sent when the dashboard shows): " + error.message);
      }
    });
}

widget.onSettings(function () {
  syncAlerts();
  refresh();
});

// The dashboard was shown again: the capability runs again, so refresh at once and re-send the opt-in.
widget.onVisible(function () {
  syncAlerts().then(refresh);
});

widget.onAction(function (name) {
  if (name === "refresh") { refresh(); }
});

syncAlerts();
refresh();
widget.every(widget.settings.refreshIntervalSeconds ?? 5, refresh);
