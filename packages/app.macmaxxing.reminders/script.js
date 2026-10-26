// Reminders — turns `reminders.list` into view state. The host draws everything.
var latest = null;
var ORDER = ["high", "medium", "low", "none"];

// Share (0-100) of today's tasks per priority; the labels come from the capability (localized).
function priorityChart(items) {
  var counts = {};
  var labels = {};
  items.forEach(function (item) {
    counts[item.priority] = (counts[item.priority] || 0) + 1;
    labels[item.priority] = item.priorityLabel;
  });
  return ORDER.filter(function (key) { return counts[key]; }).map(function (key) {
    return { label: labels[key], value: Math.round(counts[key] * 100 / items.length) };
  });
}

function render() {
  if (!latest) { return; }
  var limit = widget.settings.maximumRows || 6;
  var items = latest.items || [];
  var first = items[0];
  widget.setState({
    isReady: latest.status === "ok" && items.length > 0,
    isEmpty: latest.status === "ok" && items.length === 0,
    needsAccess: latest.status === "needsAccess",
    isDenied: latest.status === "denied",
    isUnavailable: latest.status === "unavailable",
    summary: first ? first.title : "",
    caption: first ? first.dueText : "",
    count: items.length,
    rows: items.slice(0, limit).map(function (item) {
      return { title: item.title, value: item.dueText };
    }),
    priorityChart: priorityChart(items)
  });
}

function refresh() {
  return host.call("reminders.list", "today", {}).then(function (result) {
    latest = result;
    render();
  }, function () {});
}

widget.onSettings(render);
widget.onVisible(refresh);
widget.onAction(function (name) {
  if (name === "requestAccess") {
    host.call("reminders.list", "requestAccess", {}).then(refresh, function () {});
  }
});

refresh();
widget.every(widget.settings.refreshIntervalSeconds || 10, refresh);
