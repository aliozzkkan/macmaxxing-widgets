// Screenshot Shelf: turns `screenshots.history` into view state. The host draws everything.
var items = [];
var scanStatus = "ok";
var reading = "";

function dayLabel(seconds) {
  var date = new Date(seconds * 1000);
  return String(date.getDate()) + "/" + String(date.getMonth() + 1);
}

function limit() {
  var rows = widget.settings.maximumRows;
  return typeof rows === "number" && rows > 0 ? Math.min(rows, 20) : 6;
}

// Captures per day over the listed items: measured counts only.
function days() {
  var counts = {};
  var order = [];
  items.forEach(function (item) {
    var label = dayLabel(item.modifiedAt);
    if (!counts[label]) { counts[label] = 0; order.push(label); }
    counts[label] += 1;
  });
  return order.reverse().map(function (label) { return { label: label, value: counts[label] }; });
}

function render() {
  var latest = items[0] || null;
  widget.setState({
    items: items,
    count: items.length,
    hasItems: items.length > 0,
    latestName: latest ? latest.name : "",
    latestThumbnail: latest ? latest.thumbnail : "",
    latestFile: latest ? latest.file : "",
    days: days(),
    needsAccess: scanStatus === "needsAccess",
    isFailed: scanStatus === "failed",
    isEmpty: scanStatus === "empty",
    reading: reading
  });
}

function refresh() {
  return host.call("screenshots.history", "list", { limit: limit() }).then(function (result) {
    items = result.items || [];
    scanStatus = result.scanStatus || "ok";
    render();
  }, function () {});
}

function read(id) {
  return host.call("screenshots.history", "readText", { id: id }).then(function (result) {
    reading = (result.qr ? result.qr + "\n" : "") + (result.text || "");
    render();
  }, function (error) {
    reading = error.message;
    render();
  });
}

widget.onSettings(refresh);
widget.onVisible(refresh);

widget.onAction(function (name, payload) {
  var id = payload && payload.id;
  var latest = items[0];
  if (name === "preview" && id) {
    host.call("screenshots.history", "preview", { id: id }).then(function () {}, function () {});
  } else if (name === "reveal" && id) {
    host.call("screenshots.history", "reveal", { id: id }).then(function () {}, function () {});
  } else if (name === "trash" && id) {
    host.call("screenshots.history", "trash", { id: id }).then(refresh, function () {});
  } else if (name === "readText" && id) {
    read(id);
  } else if (name === "readLatest" && latest) {
    read(latest.id);
  } else if (name === "revealLatest" && latest) {
    host.call("screenshots.history", "reveal", { id: latest.id }).then(function () {}, function () {});
  } else if (name === "requestAccess") {
    host.call("screenshots.history", "requestFolderAccess", {}).then(refresh, function () {});
  } else if (name === "openSettings") {
    host.call("screenshots.history", "openShelfSettings", {}).then(function () {}, function () {});
  } else if (name === "refresh") {
    refresh();
  }
});

host.on("screenshots.history", "changed", refresh);
refresh();
widget.every(widget.settings.refreshIntervalSeconds || 10, refresh);
