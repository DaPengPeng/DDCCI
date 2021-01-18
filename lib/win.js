'use strict';

const winDDC = require('hensm-ddcci')

const Translate = require('./Translate')
const localization = {
  detected: "en",
  default: {},
  desired: {},
  all: [],
  languages: []
}

let T = new Translate(localization.desired, localization.default)
let monitorNames = []
function makeName(monitorDevice, fallback) {
  if (monitorNames[monitorDevice] !== undefined) {
    return monitorNames[monitorDevice]
  } else {
    return fallback;
  }
}

function getMonitorList() {
  let local = 0
  let ret = []
  for (const monitor in winDDC.getMonitorList()) {
    ret.push({
      name: makeName(monitor, `${T.getString("GENERIC_DISPLAY_SINGLE")} ${local + 1}`),
      id: monitor,
      localID: local,
      info: monitor
    })
  }
  return ret;
};
let monitorList = getMonitorList()

function getMonitorId(localID) {
  for (const monitor in monitorList) {
    if (monitor.localID === localID) {
      return monitor.id;
    }
  }
  return ''
}

exports.setBrightness = function (localID, val) {
  return winDDC.setBrightness(getMonitorId(localID), val)
};

exports.getBrightness = function (localID) {
  return winDDC.getBrightness(getMonitorId(localID))
};

exports.getMaxBrightness = function (localID) {
  return winDDC.getMaxBrightness(getMonitorId(localID))
};

exports.setContrast = function (localID, val) {
  return winDDC.setContrast(getMonitorId(localID), val)
};

exports.getContrast = function (localID) {
  return winDDC.getContrast(getMonitorId(localID))
};

exports.getMaxContrast = function (localID) {
  return winDDC.getMaxContrast(getMonitorId(localID))
};

exports._setVCP = function (localID, con, val) {
  return winDDC._setVCP(getMonitorId(localID), con, val)
};

exports._getVCP = function (localID, con, val) {
  return winDDC._getVCP(getMonitorId(localID, con, val))
};

exports._refresh = function () {
  winDDC._refresh()
  monitorList = getMonitorList()
};

exports.getMonitorList = getMonitorList;
