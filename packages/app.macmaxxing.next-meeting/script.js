// Next Meeting — turns `calendar.events` into the next meeting, its countdown and the join button.
// The host draws everything; the countdown ticks in the host without script calls.
var latest = null;

function pad(number) { return number < 10 ? "0" + number : "" + number; }

function startLabel(event) {
  return String(event.timeRange || "").split(" \u2013 ")[0];
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
  var settings = widget.settings;
  var now = Date.now() / 1000;
  var events = latest.events || [];
  var showEnded = settings.showEnded === true;
  var upcoming = events.filter(function (event) { return showEnded || event.end > now; });
  var next = upcoming[0];
  var early = typeof settings.joinEarlyMinutes === "number" ? settings.joinEarlyMinutes : 5;
  var canJoin = !!next && settings.oneClickJoin !== false && !!next.meetingURL &&
    now >= next.start - early * 60 && now < next.end;
  var showService = settings.showMeetingService !== false;
  var ok = latest.status === "ok";
  widget.setState({
    hasMeeting: ok && !!next,
    isUpcoming: ok && !!next && next.start > now,
    isLive: ok && !!next && next.start <= now,
    isNone: ok && !next,
    needsAccess: latest.status === "needsAccess",
    isDenied: latest.status === "denied",
    startEpoch: next ? next.start : 0,
    title: next ? next.title : "",
    timeRange: next ? startLabel(next) : "",
    service: next && showService && next.service ? next.service : "",
    hasService: !!(next && showService && next.service),
    canJoin: canJoin,
    joinId: next ? next.id : "",
    rows: upcoming.slice(0, settings.maximumRows || 5).map(function (event) {
      var row = { title: event.title, value: startLabel(event) };
      if (showService && event.service) { row.detail = event.service; }
      return row;
    }),
    busyChart: busyChart(events, now)
  });
}

function refresh() {
  var settings = widget.settings;
  return host.call("calendar.events", "upcoming", {
    hours: settings.lookAheadHours || 24,
    includeEnded: settings.showEnded === true
  }).then(function (result) {
    latest = result;
    render();
  }, function () {});
}

widget.onSettings(refresh);
widget.onVisible(refresh);
widget.onAction(function (name) {
  if (name === "requestAccess") {
    host.call("calendar.events", "requestAccess", {}).then(refresh, function () {});
  } else if (name === "join") {
    var now = Date.now() / 1000;
    var candidates = ((latest && latest.events) || []).filter(function (event) {
      return widget.settings.showEnded === true || event.end > now;
    });
    if (candidates[0]) {
      host.call("calendar.events", "join", { id: candidates[0].id }).then(function () {}, function () {});
    }
  }
});

refresh();
widget.every(widget.settings.refreshIntervalSeconds || 30, refresh);
// The join button and "in progress" follow the clock between refreshes.
widget.every(5, render);
