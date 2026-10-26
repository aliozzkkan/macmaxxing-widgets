// Local Servers — turns `system.localServers` into view state and runs its actions.
// The host draws everything and asks for confirmation before `stop`.
var latest = null;
var selectedId = null;

function share(items) {
  var counts = {};
  var order = [];
  items.forEach(function (item) {
    if (!counts[item.process]) { counts[item.process] = 0; order.push(item.process); }
    counts[item.process] += 1;
  });
  return order.map(function (name) {
    return { label: name, value: Math.round(counts[name] * 100 / items.length), count: counts[name] };
  }).sort(function (a, b) { return b.count - a.count; }).slice(0, 6).map(function (entry) {
    return { label: entry.label, value: entry.value };
  });
}

function render() {
  if (!latest) { return; }
  var settings = widget.settings;
  var items = latest.items || [];
  var ok = latest.status === "ok";
  var selected = null;
  items.forEach(function (item) { if (item.id === selectedId) { selected = item; } });
  var showDetail = settings.density !== "compact";
  widget.setState({
    isReady: ok && items.length > 0,
    isEmpty: ok && items.length === 0,
    isUnavailable: !ok,
    summary: latest.summary || "",
    caption: latest.caption || "",
    total: latest.total || 0,
    rows: items.slice(0, settings.maximumRows || 8).map(function (item) {
      var row = { title: item.process, value: ":" + item.port };
      if (showDetail) { row.detail = item.scope + " \u00b7 PID " + item.pid; }
      return row;
    }),
    items: items.map(function (item) {
      return { id: item.id, title: item.process, detail: ":" + item.port + " \u00b7 " + item.scope };
    }),
    chart: items.length ? share(items) : [],
    selectedId: selected ? selected.id : "",
    hasSelected: !!selected,
    noSelection: items.length > 0 && !selected,
    selected: selected ? {
      title: selected.process + " :" + selected.port,
      port: selected.port,
      pid: selected.pid,
      address: selected.address,
      purpose: selected.purpose,
      protocolHint: selected.protocolHint,
      hasProject: !!selected.cwdName,
      project: selected.cwdName || ""
    } : null
  });
}

function refresh() {
  return host.call("system.localServers", "list", { limit: 30 }).then(function (result) {
    latest = result;
    render();
  }, function () {});
}

widget.onSettings(render);
widget.onVisible(refresh);
widget.onAction(function (name, payload) {
  if (name === "select") {
    selectedId = payload && payload.id ? payload.id : null;
    render();
  } else if (selectedId && (name === "open" || name === "reveal")) {
    host.call("system.localServers", name, { id: selectedId }).then(function () {}, function () {});
  } else if (selectedId && name === "stop") {
    host.call("system.localServers", "stop", { id: selectedId }).then(function () {
      selectedId = null;
      refresh();
    }, function () { refresh(); });
  }
});

refresh();
widget.every(widget.settings.refreshIntervalSeconds || 10, refresh);
