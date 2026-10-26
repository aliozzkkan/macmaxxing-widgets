// Media: turns `media.nowPlaying` into view state. The host draws everything and advances the
// progress itself from {elapsed, rate, at}, so there is no per-second work here.
function render(snapshot) {
  var s = snapshot || {};
  var hasTrack = s.state === "playing" || s.state === "paused";
  var queue = (s.queue || []).map(function (entry, index) {
    return { id: String(index), title: entry.title, detail: entry.artist || "" };
  });
  var subtitle = [s.artist, s.appName].filter(function (part) { return part; });
  widget.setState({
    playing: s.state === "playing",
    hasTrack: hasTrack,
    isIdle: !hasTrack,
    title: s.title || "",
    artist: s.artist || "",
    album: s.album || "",
    appName: s.appName || "",
    subtitle: (s.artist || s.appName || ""),
    artwork: s.artwork || "",
    elapsed: s.elapsed || 0,
    duration: s.duration || 0,
    rate: s.rate || 0,
    at: s.at || 0,
    canSeek: hasTrack && (s.duration || 0) > 0,
    hasSource: !!s.sourceURL,
    queue: widget.settings.density === "compact" ? [] : queue,
    hasQueue: widget.settings.density !== "compact" && queue.length > 0
  });
}

function refresh() {
  return host.call("media.nowPlaying", "snapshot", {}).then(render, function () {});
}

function send(method, args) {
  return host.call("media.nowPlaying", method, args || {}).then(function () {}, function () {});
}

widget.onAction(function (name, payload) {
  if (name === "playPause") { send("playPause"); }
  else if (name === "next") { send("next"); }
  else if (name === "previous") { send("previous"); }
  else if (name === "skipBack") { send("skip", { seconds: -15 }); }
  else if (name === "skipForward") { send("skip", { seconds: 15 }); }
  else if (name === "seek" && payload && typeof payload.position === "number") { send("seek", { position: payload.position }); }
  else if (name === "openSource") { send("openSource"); }
});

widget.onSettings(refresh);
widget.onVisible(refresh);
host.on("media.nowPlaying", "changed", refresh);
refresh();
// A slow fallback; track and state changes arrive as events.
widget.every(30, refresh);
