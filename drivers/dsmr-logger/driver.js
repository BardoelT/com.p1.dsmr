'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

class DSMRLoggerDriver extends Homey.Driver {

	onPairListDevices(data, callback) {
		fetch('http://DSMR-API.local/api/v1/dev/info').then(function (response) {
			response.json().then(function (json) {
				let devices = [
					{
						"data": { "id": "" },
						"settings": { "interval": 0 }
					}
				]
				if (json.devinfo) {
					json.devinfo.forEach(element => {
						if (element['name'] === 'macaddress')
							devices[0].data.id = element['value'];

						if (element['name'] === 'telegraminterval')
							devices[0].settings.interval = element['value'];

						if (element['name'] === 'fwversion')
							devices[0].settings.fwversion = element['value'];

						if (element['name'] === 'boardtype')
							devices[0].settings.boardtype = element['value'];
					});
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
		this.measurePowerDeliveredTrigger = new Homey.FlowCardTriggerDevice('measure_power.delivered.changed')
			.register();
		this.measurePowerReturnedTrigger = new Homey.FlowCardTriggerDevice('measure_power.returned.changed')
			.register();
	}
}

module.exports = DSMRLoggerDriver;