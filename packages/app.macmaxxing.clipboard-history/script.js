// Clipboard History: turns `clipboard.history` into view state. The host draws everything.
var KIND_SYMBOLS = { text: "text.alignleft", file: "doc", image: "photo", link: "link" };
var items = [];
var feedback = {};
var feedbackTicks = 0;
var query = "";

function limit() {
  var rows = widget.settings.maximumRows;
  return typeof rows === "number" && rows > 0 ? Math.min(rows, 100) : 20;
}

function render() {
  var counts = {};
  items.forEach(function (item) { counts[item.kind] = (counts[item.kind] || 0) + 1; });
  var kinds = [{ t: 0, text: counts.text || 0, link: counts.link || 0, file: counts.file || 0, image: counts.image || 0 }];
  widget.setState({
    items: items.map(function (item) {
      return { id: item.id, title: item.title, detail: item.detail || "", sym: item.pinned ? "pin.fill" : KIND_SYMBOLS[item.kind] || "doc", image: item.image || "" };
    }),
    count: items.length,
    hasItems: items.length > 0,
    latest: items.length ? items[0].title : "",
    kinds: kinds,
    feedback: feedback
  });
}

function refresh() {
  if (feedbackTicks > 0 && --feedbackTicks === 0) { feedback = {}; }
  return host.call("clipboard.history", "list", { query: query, limit: limit() }).then(function (result) {
    items = result.items || [];
    render();
  }, function () {});
}

function done(id) {
  feedback = {};
  feedback[id] = true;
  feedbackTicks = 2;
  render();
}

function configure() {
  var s = widget.settings;
  return host.call("clipboard.history", "configure", {
    captureText: s.captureText !== false,
    captureFiles: s.captureFiles !== false,
    captureImages: s.captureImages !== false,
    ignoreConcealed: s.ignoreConcealed !== false,
    retentionHours: s.clipboardRetentionHours || 0,
    autoClearMinutes: s.clipboardAutoClearMinutes || 0,
    ignoredApps: s.ignoredClipboardApps || []
  }).then(function () {}, function (error) { console.log("configure failed: " + error.message); });
}

widget.onSettings(function () {
  configure();
  refresh();
});

widget.onVisible(refresh);

widget.onAction(function (name, payload) {
  var id = payload && payload.id;
  if (name === "search") {
    query = typeof payload === "string" ? payload : "";
    refresh();
  } else if (name === "copy" && id) {
    host.call("clipboard.history", "copy", { id: id }).then(function () { done(id); }, function () {});
  } else if (name === "copyClean" && id) {
    host.call("clipboard.history", "copyCleanLink", { id: id }).then(function () { done(id); }, function () {});
  } else if (name === "paste" && id) {
    host.call("clipboard.history", "paste", { id: id }).then(function () {}, function () {});
  } else if (name === "pin" && id) {
    host.call("clipboard.history", "togglePin", { id: id }).then(refresh, function () {});
  } else if (name === "clear") {
    host.call("clipboard.history", "clear", {}).then(refresh, function () {});
  } else if (name === "refresh") {
    refresh();
  }
});

host.on("clipboard.history", "changed", refresh);
refresh();
widget.every(widget.settings.refreshIntervalSeconds || 10, refresh);
