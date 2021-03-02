# DSMR-logger
This is the repository for the [Homey app](https://homey.app/nl-nl/app/com.p1.dsmr/P1-DSMRv4-Board-Lezer/) for the [DSMR logger](https://willem.aandewiel.nl/index.php/2018/08/28/slimme-meter-uitlezer/) that is developed by Willem Aandewiel and for the [DSMRv5 logger](https://github.com/mhendriks/DSMR-API-V2) developed by Martijn Hendriks.

## Installation
When adding a device with the application, the app searches for a DSRM-logger with the `DSMR-API.local/` hostname. This is the default hostname of the DSMR-logger. The DSMR-logger is saved with the MAC-address as unique ID. The `telegraminterval` of the DSRM-logger is used as interval for the app. 

## Devices
This app contains three device drivers.

### dsmr-logger
The device driver dsmr-logger is the new driver for supporting the new REST-API of the DSMRloggerAPI firmware of the DSMR-logger of Willem Aandewiel. This driver is in development, feature-requests and bug-fixes are welcome. 

### dsmr-logger-api-v2
The device driver dsmr-logger-api-v2 is the new driver for the DSMR-logger of Martijn Hendriks.

### p1-smartmeter (deprecated)
The device driver p1-smartmeter is developed for the DSMRloggerWS software for the DSMR-logger. The DSRMloggerWS is an old firmware version and no longer maintained by the developer, so the device driver is also deprecated.

## Settings
After installation the following properties can be changed on the device: 
 - Hostname, can also be an IP-address
 - Interval
