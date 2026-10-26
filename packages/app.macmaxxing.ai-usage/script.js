// AI Usage — turns `ai.usage` into view state. Credentials and every request stay in the host;
// the script only sees numbers and provider names.
var latest = null;
var NAMES = {
  "codex": "Codex",
  "github-copilot": "GitHub Copilot",
  "claude": "Claude",
  "cursor": "Cursor",
  "windsurf": "Windsurf",
  "gemini-code-assist": "Gemini Code Assist"
};
var DEFAULT = ["codex", "github-copilot", "claude", "cursor"];
var OPTIONS = Object.keys(NAMES).map(function (id) { return { value: id, label: NAMES[id] }; });

function selected() {
  var chosen = widget.settings.providers;
  return Array.isArray(chosen) && chosen.length > 0 ? chosen.slice(0, 4) : DEFAULT;
}

// The metric that is used the most.
function top(provider) {
  var best = null;
  (provider.metrics || []).forEach(function (metric) {
    if (!best || metric.utilization > best.utilization) { best = metric; }
  });
  return best;
}

function render() {
  var providers = latest ? latest.providers || [] : [];
  var measured = providers.map(function (provider) {
    return { provider: provider, metric: top(provider) };
  }).filter(function (entry) { return entry.metric; });
  var maxUsed = 0;
  measured.forEach(function (entry) { maxUsed = Math.max(maxUsed, entry.metric.utilization); });
  var used = Math.round(maxUsed);
  widget.setState({
    providerOptions: OPTIONS,
    hasData: measured.length > 0,
    isEmpty: !!latest && measured.length === 0,
    maxUsed: used,
    maxUsedText: used + "%",
    leastText: (100 - used) + "%",
    caption: measured.length ? measured.map(function (entry) { return entry.provider.name; }).join(" \u00b7 ") : "",
    rows: providers.map(function (provider) {
      var metric = top(provider);
      return {
        title: provider.name,
        value: metric ? Math.round(metric.utilization) + "%" : "--",
        detail: metric ? metric.title : (provider.error || "")
      };
    }),
    chart: measured.map(function (entry) {
      return { label: entry.provider.name, value: Math.round(entry.metric.utilization) };
    }),
    slots: measured.slice(0, 4).map(function (entry) {
      var value = Math.round(entry.metric.utilization);
      return {
        name: entry.provider.name + " \u00b7 " + entry.metric.title,
        used: value,
        usedText: value + "%",
        hasReset: !!entry.metric.resetAt,
        resetAt: entry.metric.resetAt || 0
      };
    })
  });
}

function read() {
  return host.call("ai.usage", "snapshot", { providers: selected() }).then(function (result) {
    latest = result;
    render();
  }, function () {});
}

// Showing the dashboard asks the host to read again (the host keeps its own short cache).
function refresh() {
  return host.call("ai.usage", "refresh", {}).then(read, read);
}

widget.onSettings(read);
widget.onVisible(refresh);

render();
read();
widget.every(60, read);
