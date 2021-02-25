'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

class DSMRLoggerAPIv2Driver extends Homey.Driver {

	onPairListDevices(data, callback) {
		fetch('http://dsmr-api.local/api/v2/dev/info').then(function (response) {
			response.json().then(function (json) {
				let devices = [
					{
						"data": { "id": "" },
						"settings": { "interval": 0 }
					}
				]

				if (json.macaddress) {
					devices[0].data.id = json.macaddress;
					devices[0].settings.interval = json.telegraminterval || 'n/a';
					devices[0].settings.fwversion = json.fwversion || 'n/a';
					devices[0].settings.boardtype = json.boardtype || 'n/a';
				} else
					devices = [];
				callback(null, devices);
			});
		}).catch(function (err) {
			console.log(err);
			callback(null, []);
		});
	}
	
	onInit() {
		super.onInit();
		this._measurePowerConsumedTrigger = new Homey.FlowCardTriggerDevice('measure_power.consumed.changed')
			.register();
		this._measurePowerReturnedTrigger = new Homey.FlowCardTriggerDevice('measure_power.returned.changed')
			.register();
	}
}

module.exports = DSMRLoggerAPIv2Driver;