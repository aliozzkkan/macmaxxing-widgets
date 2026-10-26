// Keep Awake: asks `system.awake` to start/stop sessions and mirrors its status. The app owns the
// session, the timers and the automatic rules; this script only draws state and forwards choices.
var latest = null;
var CALL = "system.awake";

function options() {
  var s = widget.settings;
  return { allowsDisplaySleep: s.allowsDisplaySleep === true, lidClosed: s.keepsAwakeWithLidClosed === true };
}

function config() {
  var s = widget.settings;
  return {
    lowBatteryProtection: s.lowBatteryProtection !== false,
    lowBatteryThreshold: s.lowBatteryThreshold || 20,
    notifications: s.notificationsEnabled !== false,
    allowsDisplaySleep: s.allowsDisplaySleep === true,
    lidClosed: s.keepsAwakeWithLidClosed === true,
    rules: {
      onPower: s.automaticAwakePower === true,
      onExternalDisplay: s.automaticAwakeDisplay === true,
      apps: s.automaticAwakeApps || []
    }
  };
}

function render() {
  var active = !!(latest && latest.active);
  var timed = active && latest.mode !== "indefinite" && typeof latest.endsAt === "number";
  widget.setState({
    isActive: active,
    isIdle: !active,
    isTimed: timed,
    isIndefinite: active && !timed,
    endsAt: timed ? latest.endsAt : 0
  });
}

function apply(status) { latest = status; render(); }
function fail(error) { console.log("system.awake failed: " + error.message); }

function refresh() {
  return host.call(CALL, "status", {}).then(apply, function () {});
}

function activate(args) {
  var request = options();
  request.minutes = args.minutes;
  request.indefinite = args.indefinite === true;
  return host.call(CALL, "activate", request).then(apply, fail);
}

function shift(minutes) {
  if (!latest || typeof latest.remainingSeconds !== "number") { return; }
  var next = Math.ceil(latest.remainingSeconds / 60) + minutes;
  activate({ minutes: Math.max(1, next) });
}

// What the user last chose in settings; only a real change is forwarded, so a script start does
// not overwrite the saved options (they were seeded from the old widget on migration).
var applied = JSON.stringify(config());

widget.onSettings(function () {
  var current = JSON.stringify(config());
  if (current === applied) { return; }
  applied = current;
  host.call(CALL, "configure", config()).then(apply, fail);
});

widget.onAction(function (name) {
  if (name === "start15") { activate({ minutes: 15 }); }
  else if (name === "start30") { activate({ minutes: 30 }); }
  else if (name === "start60") { activate({ minutes: 60 }); }
  else if (name === "startIndefinite") { activate({ indefinite: true }); }
  else if (name === "plus15") { shift(15); }
  else if (name === "minus15") { shift(-15); }
  else if (name === "stop") { host.call(CALL, "deactivate", {}).then(apply, fail); }
});

host.on(CALL, "changed", apply);
widget.onVisible(function () { refresh(); });
refresh();
widget.every(30, refresh);
