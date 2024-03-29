'use strict';
var execFile = require('child_process').execFile;
var Promise = require('pinkie-promise');
var pify = require('pify');

let unixPath = (__dirname.indexOf('app.asar') !== -1) ? process.resourcesPath + '/app.asar.unpacked/node_modules/linty-ddcci/lib' : __dirname;

function value(str, index = 0) {
  let regex = new RegExp('current: (\\d+), max: (\\d+)');
  str = regex.exec(str);
  if (!str) {
    return ''
  }
  if (str.length > 2 && index <= 2) {
    if (index === 0) {
      return {'current': str[1], 'max': str[2]}
    } else {
      return str[index];
    }
  } else {
    return ''
  }
}

function monitorListFromStr(str) {
  let regex = new RegExp('D: CGDisplay .* name:(.*) screenID: (\\d+)');
  str = regex.exec(str);
  if (!str) {
    return []
  }

  let ret = []
  for (let i = 0; i < str.length; i += 3) {
    if (str.length > i + 2) {
      ret.push({
        name: str[i + 1],
        id: str[i + 2],
        localID: i,
        info: str[i]
      })
    } else {
      return []
    }
  }
  return ret
}

async function queryControl(monitorId, control, index) {

  checkPlatform()
  checkMonitorId(monitorId)

  let stdout = await pify(execFile, Promise)('./ddcctl', ['-d', String(monitorId), control, '?'], {cwd: unixPath});

  if (stdout) {
    return value(stdout, index)
  }
  return ''
}

function setControl(monitorId, control, val) {

  checkPlatform()
  checkNumVal(val)

  return pify(execFile, Promise)('./ddcctl', ['-d', String(monitorId), control, String(val)], {cwd: unixPath});
}

function checkPlatform() {
  if (process.platform !== 'darwin') {
    return Promise.reject(new Error('Only OS X systems are supported'));
  }
}

function checkMonitorId(monitorId) {
  if (typeof monitorId === 'string') {
    monitorId = Number(monitorId)
  }
  if (typeof monitorId !== 'number' || isNaN(monitorId)) {
    return Promise.reject(new TypeError('Expected a number'));
  }

  if (monitorId < 0) {
    return Promise.reject(new Error('Expected a value >= 0'));
  }
}

function checkControl(control) {
  if (typeof control !== 'number' || isNaN(control)) {
    return Promise.reject(new TypeError('Expected a number'));
  }

  if (control < 0 || control >= 255) {
    return Promise.reject(new TypeError('Expected a number'));
  }
}

function checkNumVal(val) {
  if (typeof val !== 'number' || isNaN(val)) {
    return Promise.reject(new TypeError('Expected a number'));
  }
}

async function getMonitorList() {

  checkPlatform()
  let stdout = await pify(execFile, Promise)('./ddcctl', ['-h'], {cwd: unixPath})
  if (stdout) {
    return monitorListFromStr(stdout)
  }
  return []
};

let monitorArray = []

function refreshMonitorArray() {
  getMonitorList().then(result => {
    monitorArray = result
  })
}

refreshMonitorArray()

function getMonitorId(localID) {
  for (const monitor of monitorArray) {
    if (monitor.localID === localID) {
      return monitor.id;
    }
  }
  return ''
}

exports.setBrightness = function (monitorId, val) {
  return setControl(getMonitorId(monitorId), '-b', val)
};

exports.getBrightness = function (monitorId) {
  return queryControl(getMonitorId(monitorId), '-b', 1)
};

exports.getMaxBrightness = function (monitorId) {
  return queryControl(getMonitorId(monitorId), '-b', 2)
};

exports.setContrast = function (monitorId, val) {
  return setControl(getMonitorId(monitorId), '-c', val)
};

exports.getContrast = function (monitorId) {
  return queryControl(getMonitorId(monitorId), '-c', 1)
};

exports.getMaxContrast = function (monitorId) {
  return queryControl(getMonitorId(monitorId), '-c', 2)
};

exports._setVCP = function (monitorId, con, val) {

  checkPlatform()
  checkMonitorId(monitorId)
  checkControl(con)
  checkNumVal(val)

  return pify(execFile, Promise)('./ddcctl', ['-d', String(getMonitorId(monitorId)), '-C', con, String(val)], {cwd: unixPath});
};

exports._getVCP = async function (monitorId, con) {

  checkPlatform()
  checkMonitorId(monitorId)
  checkControl(con)

  let stdout = await pify(execFile, Promise)('./ddcctl', ['-d', String(getMonitorId(monitorId)), '-C', con, '?'], {cwd: unixPath})
  if (stdout) {
    return value(stdout)
  }
  return ''
};

exports._refresh = function () {
  refreshMonitorArray()
  return getMonitorList()
};

exports.getMonitorList = getMonitorList;
