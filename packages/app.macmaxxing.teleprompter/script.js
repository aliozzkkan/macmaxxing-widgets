// Teleprompter — the editor and prompter windows stay in the host; this card shows the script and starts it.
var latest = { wordCount: 0, preview: "", running: false, finished: false };

function render() {
  var words = latest.wordCount || 0;
  widget.setState({
    wordCount: words,
    preview: latest.preview || "",
    hasScript: words > 0,
    isRunning: latest.running === true,
    isFinished: latest.finished === true && latest.running !== true,
    isReady: words > 0 && latest.running !== true && latest.finished !== true,
    isEmpty: words === 0 && latest.running !== true
  });
}

function refresh() {
  return host.call("teleprompter", "status", {}).then(function (status) {
    latest = status;
    render();
  }, function () {});
}

host.on("teleprompter", "changed", function (status) {
  latest = status;
  render();
});

widget.onVisible(refresh);

widget.onAction(function (name) {
  var methods = { edit: "openEditor", start: "start", stop: "stop" };
  var method = methods[name];
  if (!method) { return; }
  host.call("teleprompter", method, {}).then(refresh, function (error) {
    console.log("teleprompter." + method + " failed: " + error.message);
  });
});

render();
refresh();
