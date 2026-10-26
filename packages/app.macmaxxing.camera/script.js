// Camera — the studio window stays in the host; this card shows the permission and opens it.
var latest = { permission: "notDetermined", recording: false };

function render() {
  widget.setState({
    permission: latest.permission,
    isAuthorized: latest.permission === "authorized",
    isUndecided: latest.permission === "notDetermined",
    isDenied: latest.permission === "denied",
    isRecording: latest.recording === true,
    canRecord: latest.permission === "authorized" && latest.recording !== true
  });
}

function refresh() {
  return host.call("camera.studio", "status", {}).then(function (status) {
    latest = status;
    render();
  }, function () {});
}

host.on("camera.studio", "changed", function (status) {
  latest = status;
  render();
});

widget.onVisible(refresh);

widget.onAction(function (name) {
  if (name === "primary") {
    // The system prompt can take longer than the user-action window, so asking and opening are two taps.
    var call = latest.permission === "notDetermined" ? "requestAccess" : "openStudio";
    host.call("camera.studio", call, {}).then(refresh, function (error) {
      console.log("camera." + call + " failed: " + error.message);
    });
  } else if (name === "record") {
    host.call("camera.studio", "startRecording", {}).then(refresh, function (error) {
      console.log("camera.startRecording failed: " + error.message);
    });
  }
});

render();
refresh();
