// GitHub Center — turns `github.notifications` into view state. The `gh` login stays in the host.
var latest = null;

function render() {
  if (!latest) { return; }
  var ok = latest.status === "ok";
  var items = latest.items || [];
  var first = items[0];
  widget.setState({
    hasUnread: ok && latest.unread > 0,
    isCalm: ok && latest.unread === 0,
    isMissing: latest.status === "ghMissing",
    isSignedOut: latest.status === "signedOut",
    isFailed: latest.status === "failed",
    unread: latest.unread || 0,
    firstTitle: first ? first.title : "",
    firstRepo: first ? first.repo : "",
    rows: items.slice(0, 12).map(function (item) {
      return { title: item.title, value: item.reasonLabel, detail: item.repo };
    }),
    items: items.map(function (item) {
      return { id: item.id, title: item.title, detail: item.repo + " \u00b7 " + item.reasonLabel, symbol: "bell.fill" };
    }),
    chart: (latest.reasons || []).map(function (entry) {
      return { label: entry.label, value: Math.round(entry.count * 100 / Math.max(1, latest.unread)) };
    })
  });
}

function refresh() {
  return host.call("github.notifications", "snapshot", {}).then(function (result) {
    latest = result;
    render();
  }, function () {});
}

widget.onVisible(refresh);
widget.onAction(function (name, payload) {
  if (name === "open" && payload && payload.id) {
    host.call("github.notifications", "open", { id: payload.id }).then(function () {}, function () {});
  }
});

refresh();
widget.every(widget.settings.refreshIntervalSeconds || 60, refresh);
