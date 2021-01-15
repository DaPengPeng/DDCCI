'use strict';

// if (process.platform === 'darwin') {
// 	module.exports = require('./lib/mac');
// } else if (process.platform === 'linux') {
// 	// module.exports = require('./lib/linux');
// } else {
// 	module.exports = require('./lib/win');
// }

let ddcci = false
function getDDCCI() {
	if (ddcci) return true;
	try {
		if (process.platform === 'darwin') {
			ddcci = require('./lib/mac')
		} else if (process.platform === 'linux') {
			console.log('not support for linux')
			return false
		} else {
			ddcci = require("@hensm/ddcci");
		}
		return true;
	} catch (e) {
		console.log('Couldn\'t start DDC/CI', e);
		return false;
	}
}
getDDCCI();


export const monitorManager = {

	//显示器数组
	monitors: [],


	getMonitorList() {
		this.monitors.splice(0, this.monitors.length)
		for (let i = 0; i < ddcci.getMonitorList().length; i++) {
			this.monitors.push({
				localID: i,
				id: mo
			})
		}
	}
};
