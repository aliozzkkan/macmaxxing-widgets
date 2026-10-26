// Secure Shelf — the encrypted vault stays in the host. Note text and image previews reach this
// script only as opaque handles ("h_..."); it never holds vault content.
var shelf = { locked: true, itemCount: 0 };
var items = [];
var query = "";
var selectedId = "";
var noteHandle = "";

function symbolFor(kind) {
  return kind === "note" ? "note.text" : (kind === "image" ? "photo" : "doc");
}

function render() {
  var selected = items.filter(function (item) { return item.id === selectedId; })[0];
  widget.setState({
    isLocked: shelf.locked !== false,
    isUnlocked: shelf.locked === false,
    itemCount: shelf.itemCount || 0,
    hasItems: items.length > 0,
    items: items.map(function (item) {
      return { id: item.id, name: item.name, symbol: symbolFor(item.kind), preview: item.preview || "" };
    }),
    selectedId: selectedId,
    isNoteSelected: !!selected && selected.kind === "note" && noteHandle !== "",
    isImageSelected: !!selected && selected.kind === "image" && !!selected.preview,
    previewHandle: selected && selected.preview ? selected.preview : "",
    noteHandle: noteHandle
  });
}

function clear() {
  items = [];
  selectedId = "";
  noteHandle = "";
}

function loadList() {
  if (shelf.locked !== false) { clear(); render(); return Promise.resolve(); }
  return host.call("secure.shelf", "list", { query: query }).then(function (result) {
    items = result.items || [];
    render();
  }, function () {});
}

function refresh() {
  return host.call("secure.shelf", "state", {}).then(function (state) {
    shelf = state;
    return loadList();
  }, function () {});
}

host.on("secure.shelf", "locked", function (state) {
  shelf = state;
  clear();
  render();
});
host.on("secure.shelf", "changed", function (state) {
  shelf = state;
  loadList();
});
widget.onVisible(refresh);

function open(id) {
  selectedId = id;
  noteHandle = "";
  var item = items.filter(function (entry) { return entry.id === id; })[0];
  if (item && item.kind === "note") {
    return host.call("secure.shelf", "note", { id: id }).then(function (result) {
      noteHandle = result.handle;
      render();
    }, function () {});
  }
  render();
  return Promise.resolve();
}

function call(method, args) {
  return host.call("secure.shelf", method, args || {}).then(function () {}, function (error) {
    console.log("secure.shelf." + method + " failed: " + error.message);
  });
}

widget.onAction(function (name, payload) {
  if (name === "unlock") { call("unlock").then(refresh); }
  else if (name === "lock") { call("lock").then(refresh); }
  else if (name === "pickFiles") { call("pickFiles"); }
  else if (name === "newNote") {
    host.call("secure.shelf", "newNote", {}).then(function (result) {
      return loadList().then(function () { return open(result.id); });
    }, function () {});
  }
  else if (name === "search") { query = typeof payload === "string" ? payload : ""; loadList(); }
  else if (name === "open" && payload && payload.id) { open(payload.id); }
  else if (name === "save" && payload && payload.handle) { call("saveNote", { handle: payload.handle }).then(loadList); }
  else if (name === "copy" && selectedId) { call("copyNote", { id: selectedId }); }
  else if (name === "export" && payload && payload.id) { call("export", { id: payload.id }); }
  else if (name === "remove" && payload && payload.id) {
    if (payload.id === selectedId) { selectedId = ""; noteHandle = ""; }
    call("remove", { id: payload.id }).then(loadList);
  }
  else if (name === "dropped" && payload && payload.items) {
    var dropped = payload.items.map(function (item) { return { handle: item.handle }; });
    if (shelf.locked !== false) { return; }
    call("add", { items: dropped }).then(loadList);
  }
});

render();
refresh();
