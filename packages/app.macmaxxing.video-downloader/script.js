// Video Downloader — yt-dlp and FFmpeg run behind the `video.download` capability.
var latest = { state: "idle" };

function render() {
  var state = latest.state || "idle";
  var busy = state === "preparing" || state === "downloading";
  widget.setState({
    state: state,
    isIdle: state === "idle",
    isPreparing: state === "preparing",
    isDownloading: state === "downloading",
    isBusy: busy,
    isFinished: state === "finished",
    isFailed: state === "failed",
    isCancelled: state === "cancelled",
    canStart: !busy,
    progress: typeof latest.progress === "number" ? latest.progress : 0,
    title: latest.title || "",
    hasTitle: !!latest.title,
    message: latest.message || "",
    hasMessage: !!latest.message,
    lastFile: latest.lastFile || ""
  });
}

function options() {
  return { format: widget.settings.videoFormat, maxHeight: widget.settings.maximumVideoHeight };
}

function call(method, args) {
  return host.call("video.download", method, args || {}).then(function (status) {
    if (status && status.state) { latest = status; render(); }
  }, function (error) {
    console.log("video." + method + " failed: " + error.message);
  });
}

function refresh() {
  return host.call("video.download", "status", {}).then(function (status) {
    latest = status;
    render();
  }, function () {});
}

host.on("video.download", "progress", function (status) {
  latest = status;
  render();
});

widget.onVisible(refresh);

widget.onAction(function (name, payload) {
  if (name === "dropped") {
    var args = options();
    args.url = ((payload && payload.text) || "").split("\n")[0].trim();
    call("start", args);
  } else if (name === "paste") {
    call("startFromClipboard", options());
  } else if (name === "cancel") {
    call("cancel");
  } else if (name === "reveal") {
    call("reveal");
  }
});

render();
refresh();
