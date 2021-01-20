'use strict';
const winDDC = require('hensm-ddcci')

let isDev = require("electron-is-dev");

let wmi = false
function getWMI() {
  if (wmi) return true;
  let WmiClient = false
  try {
    if (isDev) {
      WmiClient = require('wmi-client');
    } else {
      // WmiClient = require(path.join(app.getAppPath(), '../node_modules/wmi-client'));
      WmiClient = require('wmi-client');
    }
    wmi = new WmiClient({
      host: 'localhost',
      namespace: '\\\\root\\WMI'
    });
    return true;
  } catch (e) {
    console.log('Couldn\'t start WMI', e);
    return false;
  }
};

let monitorNames = {} //key uid value name
function queryWindowsMonitor() {
  getWMI()
  wmi.query('SELECT * FROM WmiMonitorID', function (err, result) {
    if (err != null) {
    } else if (result) {
      monitorNames = {}
      for (let monitor of result) {
        let hwid = readInstanceName(monitor.InstanceName)
        hwid[2] = hwid[2].split("_")[0]
        let uid = hwid[2].split("&")[3]
        monitorNames[uid] = parseWMIString(monitor.UserFriendlyName)
      }
      console.log(monitorNames)
    }
  })
}
queryWindowsMonitor();

function readInstanceName(insName) {
  return insName.replace(/&amp;/g, '&').split("\\")
};

function parseWMIString(str) {
  if (str === null) return str;
  let hexed = str.replace('{', '').replace('}', '').replace(/;0/g, ';32')
  var decoded = '';
  var split = hexed.split(';')
  for (var i = 0; (i < split.length); i++)
    decoded += String.fromCharCode(parseInt(split[i], 10));
  decoded = decoded.trim()
  return decoded;
};

function UIDFromWinDDC(monitor) {
  let infoList = monitor.split('#');
  if (infoList.length > 0) {
    let tmp = infoList[2].split('&')
    if (tmp.length >= 4) {
      return tmp[3]
    }
  }
  return ''
};

function findName(monitor) {
  let key = UIDFromWinDDC(monitor)
  if (key.length > 0 && monitorNames[key]) {
    return monitorNames[key];
  }
  return 'Unknown Display'
};

function getMonitorList() {
  let local = 0
  let ret = []
  for (const monitor of winDDC.getMonitorList()) {
    ret.push({
      name: findName(monitor),
      id: monitor,
      localID: local,
      info: monitor
    })
  }
  return ret;
};
let monitorList = getMonitorList()

function getMonitorId(localID) {
  for (const monitor of monitorList) {
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
  queryWindowsMonitor()
  winDDC._refresh()
  monitorList = getMonitorList()
};

exports.getMonitorList = getMonitorList;
