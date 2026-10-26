// HTTP data example: one declared host, one literal https URL (the validator reads it statically).
function refresh() {
  return host.fetch("https://api.open-meteo.com/v1/forecast?latitude=41.01&longitude=28.98&current=temperature_2m").then(function (response) {
    if (response.status !== 200) { throw new Error("status " + response.status); }
    var data = JSON.parse(response.body);
    widget.setState({ hasData: true, failed: false, temperature: data.current.temperature_2m });
  }).then(function () {}, function () {
    widget.setState({ hasData: false, failed: true });
  });
}

widget.onVisible(refresh);
widget.onAction(function (name) {
  if (name === "refresh") { refresh(); }
});

refresh();
widget.every(widget.settings.refreshIntervalSeconds || 600, refresh);
