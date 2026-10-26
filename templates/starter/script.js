// Starter template: state in, view out. The host draws everything; the script only produces data.
var count = 0;

function render() {
  widget.setState({ count: count });
}

// Restore the saved value (storage survives restarts).
var saved = widget.storage.get();
if (saved && typeof saved.count === "number") { count = saved.count; }

widget.onAction(function (name) {
  if (name === "increment") {
    count += 1;
    widget.storage.set({ count: count });
    render();
  }
});

render();
