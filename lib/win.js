'use strict';
const winDDC = require('hensm-ddcci')

//wmi方案不能够获取分辨率      namespace: '\\\\root\\WMI' --- SELECT * FROM WmiMonitorID/////namespace: '\\\\root\\\\cimv2 --- SELECT * FROM Win32_DesktopMonitor'
let wmiPath = (__dirname.indexOf('app.asar') !== -1) ? process.resourcesPath+'/app.asar.unpacked/node_modules/wmi-client' :'wmi-client';
let wmi = false
function getWMI() {
  if (wmi) return true;
  let WmiClient = false
  try {
    WmiClient = require(wmiPath)
    wmi = new WmiClient({
      host: 'localhost',
      namespace: '\\\\root\\WMI'
      // namespace: '\\\\root\\\\cimv2'
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
  //获取显示器名字
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
  //获取显示器分辨率
  wmi.query('SELECT * FROM Win32_DesktopMonitor', function (err, result) {
    for (let monitor of result) {
      console.log(monitor)
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

//读取注册表中的edid信息
let {Registry} = require('rage-edit')

async function monitorInfo(monitorID) {
  let parameters = []
  let monitorArgs = monitorID.split('#')
  console.log(monitorArgs)
  if (monitorArgs.length >= 4) {
    let firstParameter = monitorArgs[0].split('?\\')
    if (firstParameter.length >= 2) {
      parameters.push(firstParameter[1])
    }
    parameters.push(monitorArgs[1])
    parameters.push(monitorArgs[2])
    console.log(parameters)
  }
  let path = parameters.join('\\')
  let ret = await Registry.get('HKEY_LOCAL_MACHINE\\SYSTEM\\ControlSet001\\Enum\\' + path + '\\Device Parameters')
}

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
    monitorInfo(monitor)
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

exports._getVCP = function (localID, con) {
  return winDDC._getVCP(getMonitorId(localID), con)
};

exports._refresh = function () {
  queryWindowsMonitor()
  winDDC._refresh()
  monitorList = getMonitorList()
};

exports.getMonitorList = getMonitorList;
