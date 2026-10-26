// Calendar — turns `calendar.events` into view state. The host draws everything.
var latest = null;

function pad(number) { return number < 10 ? "0" + number : "" + number; }

function startLabel(event) {
  return String(event.timeRange || "").split(" \u2013 ")[0];
}

function endOfToday() {
  var day = new Date();
  day.setHours(24, 0, 0, 0);
  return day.getTime() / 1000;
}

// Share (0-100) of each of the next 12 hours that events occupy.
function busyChart(events, now) {
  var first = new Date(now * 1000);
  first.setMinutes(0, 0, 0);
  var begin = first.getTime() / 1000;
  var slots = [];
  for (var hour = 0; hour < 12; hour++) {
    var from = begin + hour * 3600;
    var to = from + 3600;
    var busy = 0;
    events.forEach(function (event) {
      busy += Math.max(0, Math.min(to, event.end) - Math.max(from, event.start));
    });
    slots.push({
      label: pad(new Date(from * 1000).getHours()) + ":00",
      value: Math.min(100, Math.round(busy / 36))
    });
  }
  return slots;
}

function render() {
  if (!latest) { return; }
  var now = Date.now() / 1000;
  var limit = widget.settings.maximumRows || 6;
  var events = latest.events || [];
  var today = events.filter(function (event) { return event.start < endOfToday(); });
  var upcoming = today.filter(function (event) { return event.end > now; });
  var next = upcoming[0];
  widget.setState({
    isReady: latest.status === "ok" && !!next,
    isEmpty: latest.status === "ok" && !next,
    needsAccess: latest.status === "needsAccess",
    isDenied: latest.status === "denied",
    summary: next ? next.title : "",
    caption: next ? next.timeRange : "",
    count: upcoming.length,
    rows: upcoming.slice(0, limit).map(function (event) {
      return { title: event.title, value: startLabel(event) };
    }),
    busyChart: busyChart(events, now)
  });
}

// While the dashboard is hidden the host stops the capability and calls fail; the card keeps
// its last state and the next call after the panel opens refreshes it.
function refresh() {
  return host.call("calendar.events", "upcoming", { hours: 24, includeEnded: true }).then(function (result) {
    latest = result;
    render();
  }, function () {});
}

widget.onSettings(render);
widget.onVisible(refresh);
widget.onAction(function (name) {
  if (name === "requestAccess") {
    host.call("calendar.events", "requestAccess", {}).then(refresh, function () {});
  }
});

refresh();
widget.every(widget.settings.refreshIntervalSeconds || 10, refresh);
widget.every(30, render);
