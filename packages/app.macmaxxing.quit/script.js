// Çıkış command tile: one button that calls `app.commands.quit`. The host draws the card.
widget.setState({ ready: true });

// The call starts inside the action handler, so the host treats it as the user's own action.
widget.onAction(function (name) {
  if (name !== "run") { return; }
  host.call("app.commands", "quit", {}).then(function () {}, function (error) {
    console.log("quit failed: " + error.message);
  });
});
