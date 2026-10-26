// App Power: turns `power.processes` estimates into view state. The host draws everything.
function refresh() {
  var limit = Math.min(Math.max(widget.settings.maximumRows || 6, 1), 10);
  return host.call("power.processes", "top", { limit: limit }).then(function (result) {
    var items = (result.items || []).map(function (item, index) {
      var share = Math.round(item.share * 100);
      return { id: item.bundleID || item.name + "#" + index, name: item.name, icon: item.icon || "",
               detail: "~" + item.watts.toFixed(1) + " W · %" + share, watts: item.watts, share: share };
    });
    var top = items[0];
    widget.setState({
      items: items,
      shares: items.map(function (item) { return { label: item.name, value: item.watts }; }),
      topName: top ? top.name : "--",
      topIcon: top ? top.icon : "",
      topWatts: top ? "~" + top.watts.toFixed(1) + " W" : "--",
      topShare: top ? "%" + top.share : "",
      countText: String(items.length)
    });
  }, function () {});
}

widget.onSettings(function () { refresh(); });
widget.onVisible(function () { refresh(); });
refresh();
widget.every(widget.settings.refreshIntervalSeconds || 10, refresh);
