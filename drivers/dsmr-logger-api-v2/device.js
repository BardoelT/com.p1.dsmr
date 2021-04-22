'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

class DSMRLoggerAPIv2 extends Homey.Device {

	updateSetting(setting, value) {
		const body_json = { "name": setting, "value": value };
		var hostname = this.getSetting('hostname');
		fetch('http://' + hostname + '/api/v2/dev/settings/', { method: 'POST', body: JSON.stringify(body_json) })
			.catch(function (err) {
				this.log(err);
			});
	}

	timerElapsed(device) {
		device.timerID = setTimeout(() => { device.timerElapsed(device); }, device.getSetting('interval') * 1000);
		var energy = {
			"list": [
				{ "device": "measure_power.delivered", "factor": 1000, "dsmr": ["power_delivered_l1", "power_delivered_l2", "power_delivered_l3"] },
				{ "device": "measure_power.returned", "factor": 1000, "dsmr": ["power_returned_l1", "power_returned_l2", "power_returned_l3"] },
				{ "device": "meter_power.delivered", "factor": 1, "dsmr": ["energy_delivered_tariff1", "energy_delivered_tariff2"] },
				{ "device": "meter_power.returned", "factor": 1, "dsmr": ["energy_returned_tariff1", "energy_returned_tariff2"] },
				{ "device": "meter_power.daily.delivered", "factor": 1, "dsmr": ["energy_delivered_tariff1", "energy_delivered_tariff2"] },
				{ "device": "meter_power.daily.returned", "factor": 1, "dsmr": ["energy_returned_tariff1", "energy_returned_tariff2"] },
				{ "device": "meter_gas", "factor": 1, "dsmr": ["gas_delivered"] },
				{ "device": "meter_gas.daily", "factor": 1, "dsmr": ["gas_delivered"] },
				{ "device": "measure_voltage", "factor": 1, "dsmr": ["voltage_l1"] },
				{ "device": "measure_current", "factor": 1, "dsmr": ["current_l1"] }
			]
		};

		device.updateMeterDataYesterday(device);

		var hostname = device.getSetting('hostname');
		fetch('http://' + hostname + '/api/v2/sm/actual').then(function (response) {
			response.json().then(function (json) {
				energy.list.forEach(lookup => {
					var add = 0;
					Object.entries(json).forEach(element => {
						lookup['dsmr'].forEach(search => {
							if (search === element[0]) {
								add += (element[1].value * lookup['factor']);
							}
						});
					});
					if (lookup['device'] == 'meter_power.daily.delivered') {
						add -= device.meterDataYesterday.powerDelivered;
					}
					if (lookup['device'] == 'meter_power.daily.returned') {
						add -= device.meterDataYesterday.powerReturned;
					}
					if (lookup['device'] == 'meter_gas.daily') {
						add -= device.meterDataYesterday.gas;
					}
					device._updateProperty(lookup['device'], add);
				});
			});
		}).catch(function (err) {
			device.log(err);
		});
	}

	updateMeterDataYesterday(device) {
		let currDate = new Date().getDate();
		if (device.meterDataYesterday.date != currDate) {
			var hostname = device.getSetting('hostname');
			fetch('http://' + hostname + '/api/v2/hist/days').then(function (response) {
				response.json().then(function (json) {
					let prevSlot = (json.actSlot -1 +15) % 15;
					if (device.meterDataYesterday.actSlot != prevSlot) {
						let prevValues = json.data[prevSlot].values;
						device.meterDataYesterday.actSlot = prevSlot;
						device.meterDataYesterday.powerDelivered = prevValues[0] + prevValues[1];
						device.meterDataYesterday.powerReturned = prevValues[2] + prevValues[3];
						device.meterDataYesterday.gas = prevValues[4];
						device.meterDataYesterday.date = currDate;
					}
				});
			}).catch(function(err) {
				device.log(err);
			});
		}
	}

	_updateProperty(key, value) {
		if (this.hasCapability(key)) {
			let oldValue = this.getCapabilityValue(key);
			this.setCapabilityValue(key, value);

			if (oldValue !== null && oldValue != value) {
				let tokens = {};
				tokens[key] = value;
				let triggerFunction = this.driver.triggerFunctions[key];
				if (triggerFunction !== undefined) {
					triggerFunction(this, tokens);
				}
			}
		}
	}

	// this method is called when the Device is initialized
	onInit() {
		this.log('dsmr-logger-api-v2 init');
		this.log('Name:', this.getName());
		this.log('Class:', this.getClass());
		this.log('Hostname:', this.getSetting('hostname'));
		this.log('Interval:', this.getSetting('interval'));

		var device = this;
		this.meterDataYesterday = { date: 0, powerDelivered: 0, powerReturned: 0, gas: 0, water: 0, actSlot: -1 };
		device.timerID = setTimeout(() => { device.timerElapsed(device); }, 1000);
	}

	// eslint-disable-next-line no-unused-vars
	async onSettings({ oldSettings, newSettings, changedKeys }) {
		changedKeys.forEach(element => {
			if(element === 'interval') {
				this.updateSetting("tlgrm_interval", newSettings.interval);
			}
		});
	}

	async onDeleted()
    {
        if (this.timerID) {
            clearTimeout(this.timerID);
        }
		console.log(`Deleted device ${this.getName()}`)
    }
}

module.exports = DSMRLoggerAPIv2;
