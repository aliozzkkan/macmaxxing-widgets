// File Shelf: turns `files.shelf` into view state. The host draws everything and owns the files.
var items = [];
var KIND_SYMBOLS = { file: "doc", text: "text.alignleft", link: "link" };

function limit() {
  var rows = widget.settings.maximumRows;
  return typeof rows === "number" && rows > 0 ? Math.min(rows, 20) : 6;
}

function sizeText(bytes) {
  if (typeof bytes !== "number") { return ""; }
  if (bytes < 1024) { return bytes + " B"; }
  if (bytes < 1048576) { return Math.round(bytes / 1024) + " KB"; }
  return (bytes / 1048576).toFixed(1) + " MB";
}

function render() {
  var counts = {};
  items.forEach(function (item) { counts[item.kind] = (counts[item.kind] || 0) + 1; });
  var kinds = [{ t: 0, file: counts.file || 0, link: counts.link || 0, text: counts.text || 0 }];
  var shown = items.slice(0, limit());
  var latest = items.length ? items[items.length - 1] : null;
  widget.setState({
    items: shown.map(function (item) {
      return { id: item.id, name: item.name, detail: sizeText(item.size), sym: KIND_SYMBOLS[item.kind] || "doc", icon: item.icon || "" };
    }),
    count: items.length,
    hasItems: items.length > 0,
    latest: latest ? latest.name : "",
    latestFile: latest && latest.file ? latest.file : "",
    hasLatestFile: !!(latest && latest.file),
    kinds: kinds
  });
}

function refresh() {
  return host.call("files.shelf", "list", {}).then(function (result) {
    items = result.items || [];
    render();
  }, function () {});
}

function call(method, args) {
  return host.call("files.shelf", method, args || {}).then(refresh, function () {});
}

widget.onSettings(render);
widget.onVisible(refresh);

widget.onAction(function (name, payload) {
  var id = payload && payload.id;
  if (name === "dropped" && payload && payload.items) { call("add", { items: payload.items, text: payload.text || "" }); }
  else if (name === "open" && id) { call("open", { id: id }); }
  else if (name === "reveal" && id) { call("reveal", { id: id }); }
  else if (name === "quickLook" && id) { call("quickLook", { id: id }); }
  else if (name === "copyFile" && id) { call("copyFile", { id: id }); }
  else if (name === "copyPath" && id) { call("copyPath", { id: id }); }
  else if (name === "remove" && id) { call("remove", { id: id }); }
  else if (name === "clear") { call("clear"); }
  else if (name === "refresh") { refresh(); }
});

host.on("files.shelf", "changed", refresh);
refresh();
widget.every(widget.settings.refreshIntervalSeconds || 10, refresh);
