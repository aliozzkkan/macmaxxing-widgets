// Ayarlar command tile: one button that calls `app.commands.openSettings`. The host draws the card.
widget.setState({ ready: true });

// The call starts inside the action handler, so the host treats it as the user's own action.
widget.onAction(function (name) {
  if (name !== "run") { return; }
  host.call("app.commands", "openSettings", {}).then(function () {}, function (error) {
    console.log("openSettings failed: " + error.message);
  });
});
