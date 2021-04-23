'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

class DSMRLoggerAPIv2Driver extends Homey.Driver {

	async onPairListDevices() {
		const device = 
			{
				"data": { "id": "" },
				"settings": { "interval": 60 }
			}
		
		try {
			const response = await fetch('http://dsmr-api.local/api/v2/dev/info');
			const json = await response.json();
			device.data.id = json.macaddress;
			device.settings.interval = json.telegraminterval || 'n/a';
			device.settings.fwversion = json.fwversion || 'n/a';
			device.settings.boardtype = json.boardtype || 'n/a';
		} catch(err) {
			console.log(err);
		}
		return [device];
	}
	
	onInit() {
		super.onInit();
		this.triggers = [];
		this.triggers['measure_power.delivered'] = this.homey.flow.getDeviceTriggerCard('measure_power.delivered.changed');
		this.triggers['measure_power.returned'] = this.homey.flow.getDeviceTriggerCard('measure_power.returned.changed');
	}
}

module.exports = DSMRLoggerAPIv2Driver;