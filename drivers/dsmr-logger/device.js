'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

class DSMRLogger extends Homey.Device {

	updateSetting(setting, value) {
		const body_json = { "name": setting, "value": value };
		var hostname = this.getSetting('hostname');
		fetch('http://' + hostname + '/api/v1/dev/settings/', { method: 'POST', body: JSON.stringify(body_json) })
			.catch(function (err) {
				this.log(err);
			});
	}

	timerInfoElapsed(device) {
		device.timerInfoId = setTimeout(function () { device.timerInfoElapsed(device); }, 60 * 60 * 1000);
		var hostname = device.getSetting('hostname');
		fetch('http://' + hostname + '/api/v1/dev/info').then(function (response) {
			response.json().then(function (json) {
				let settings = { }
				json.devinfo.forEach(element => {
					if (element['name'] === 'uptime') {
						settings.uptime = element['value'];
					}
					if (element['name'] === 'freeheap') {
						settings.freeheap = element['value'] + " bytes";
					}
					if (element['name'] === 'fwversion') {
						settings.fwversion = element['value'];
					}
					if (element['name'] === 'telegraminterval') {
						settings.interval = element['value'];
					}
				});
				device.setSettings(settings).catch(function (err) { device.log(err); });
			});
		}).catch(function (err) {
			device.log(err);
		});
	}

	timerIntervalElapsed(device) {
		device.timerIntervalId = setTimeout(function () { device.timerIntervalElapsed(device); }, device.getSetting('interval') * 1000);
		var energy = {
			"list": [
				{ "device": "measure_power.delivered", "factor": 1000, "dsmr": ["power_delivered_l1", "power_delivered_l2", "power_delivered_l3"] },
				{ "device": "measure_power.returned", "factor": 1000, "dsmr": ["power_returned_l1", "power_returned_l2", "power_returned_l3"] },
				{ "device": "meter_power.delivered", "factor": 1, "dsmr": ["energy_delivered_tariff1", "energy_delivered_tariff2"] },
				{ "device": "meter_power.returned", "factor": 1, "dsmr": ["energy_returned_tariff1", "energy_returned_tariff2"] },
				{ "device": "meter_gas", "factor": 1, "dsmr": ["gas_delivered"] },
				{ "device": "meter_water", "factor": 1, "dsmr": ["water_delivered"] }
			]
		};
		var hostname = device.getSetting('hostname');
		fetch('http://' + hostname + '/api/v1/sm/actual').then(function (response) {
			response.json().then(function (json) {
				energy.list.forEach(lookup => {
					var add = 0;
					json.actual.forEach(element => {
						lookup['dsmr'].forEach(search => {
							if (search === element['name']) {
								add += (element['value'] * lookup['factor']);
							}
						});
					});
					device.updateProperty(lookup['device'], add);
				});
			});
		}).catch(function (err) {
			device.log(err);
		});
	}

	updateProperty(key, value) {
		if (this.hasCapability(key)) {
			let oldValue = this.getCapabilityValue(key);
			this.setCapabilityValue(key, value);

			if (oldValue !== null && oldValue != value) {
				let tokens = {};
				tokens[key] = value;
				let triggerCard = this.driver.triggers[key];
				if (triggerCard !== undefined) {
					triggerCard.trigger(this, tokens);
				}
			}
		}
	}

	// this method is called when the Device is initialized
	onInit() {
		this.log('dsmr-logger init');
		this.log('Name:', this.getName());
		this.log('Class:', this.getClass());
		this.log('Hostname:', this.getSetting('hostname'));
		this.log('Interval:', this.getSetting('interval'));

		var device = this;
		device.timerInfoElapsed(device);
		device.timerIntervalElapsed(device);
	}

	async onSettings(oldSettingsObj, newSettingsObj, changedKeysArr) {
		changedKeysArr.forEach(element => {
			if (element === 'interval') {
				this.updateSetting("tlgrm_interval", newSettingsObj.interval);
				clearTimeout(this.timerIntervalId);
				this.timerIntervalElapsed(this);
			}
		});
	}

	async onDeleted() {
		if (this.timerIntervalId) {
			clearTimeout(this.timerIntervalId);
		}
		if (this.timerInfoId) {
			clearTimeout(this.timerInfoId);
		}
		console.log(`Deleted device ${this.getName()}`)
	}
}

module.exports = DSMRLogger;
