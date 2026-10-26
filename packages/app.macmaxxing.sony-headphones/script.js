// Sony Headphones — Bluetooth control behind the `sony.headphones` capability.
var latest = { connection: "disconnected", battery: {}, devices: [] };
// The values the headset was last given; a settings change only sends what differs.
var applied = JSON.parse(JSON.stringify(widget.settings));

function render() {
  var connection = latest.connection || "disconnected";
  var battery = latest.battery || {};
  var devices = (latest.devices || []).map(function (device) {
    return { id: device.id, name: device.name, symbol: device.active ? "checkmark.circle.fill" : "circle" };
  });
  widget.setState({
    deviceName: latest.deviceName || "WH-1000XM6",
    isConnected: connection === "connected",
    isConnecting: connection === "connecting",
    isOffline: connection === "disconnected" || connection === "failed",
    hasBattery: typeof battery.level === "number",
    battery: typeof battery.level === "number" ? battery.level : 0,
    isCharging: battery.charging === true,
    isNoiseCancelling: latest.noiseControl === "noiseCancelling",
    isAmbient: latest.noiseControl === "ambientSound",
    isNoiseOff: latest.noiseControl === "off",
    ambientLevel: typeof latest.ambientLevel === "number" ? latest.ambientLevel : 0,
    devices: devices,
    hasDevices: devices.length > 0
  });
}

function apply(status) {
  if (status && status.connection) { latest = status; render(); }
}

function call(method, args) {
  return host.call("sony.headphones", method, args || {}).then(apply, function (error) {
    console.log("sony." + method + " failed: " + error.message);
  });
}

host.on("sony.headphones", "changed", apply);
widget.onVisible(function () { call("state"); });

var SETTERS = {
  noiseControl: function (v) { return call("setNoiseControl", { mode: v }); },
  ambientLevel: function (v) { return call("setAmbientLevel", { value: v }); },
  focusOnVoice: function (v) { return call("setFocusOnVoice", { enabled: v === true }); },
  equalizer: function (v) { return call("setEqualizer", { preset: v }); },
  speakToChat: function (v) { return call("setSpeakToChat", { enabled: v === true }); },
  pauseWhenTakenOff: function (v) { return call("setPauseWhenTakenOff", { enabled: v === true }); },
  automaticPowerOff: function (v) { return call("setAutomaticPowerOff", { mode: v }); }
};

widget.onSettings(function (settings) {
  Object.keys(SETTERS).forEach(function (key) {
    if (settings[key] !== undefined && settings[key] !== applied[key]) {
      applied[key] = settings[key];
      SETTERS[key](settings[key]);
    }
  });
});

widget.onAction(function (name, payload) {
  if (name === "connect") { call("connect"); }
  else if (name === "refresh") { call("refresh"); }
  else if (name === "switch" && payload && payload.id) { call("switchPlayback", { deviceID: payload.id }); }
});

render();
call("state");
