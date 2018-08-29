'use strict';

process.title = 'ambient-playbulb discovery...';
const allowDuplicates = process.argv.length >= 3 ? Boolean(process.argv[2].toLowerCase()) : false;

const noble = require('noble-uwp');

noble.on('stateChange', state => {
    if (state === 'poweredOn') {
        noble.startScanning([], allowDuplicates);
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', peripheral => {
    console.log('\n');
    console.log('\t\t         ID: ' + peripheral.id + ' <' + peripheral.address + ', ' + peripheral.addressType + '>');
    console.log('\t\t       Name: ' + peripheral.advertisement.localName);
    console.log('\t\tConnectable: ' + peripheral.connectable);
    if (peripheral.advertisement.manufacturerData) {
        console.log('\t  Manufacturer data: ' + peripheral.advertisement.manufacturerData.toString('hex'));
    }
    console.log('\t\t       RSSI: ' + peripheral.rssi);
    if (peripheral.advertisement.txPowerLevel !== undefined) {
        console.log('\t     TX power level: ' + peripheral.advertisement.txPowerLevel);
    }
    console.log('\t\t   Services: ' + JSON.stringify(peripheral.advertisement.serviceUuids));
    const serviceData = peripheral.advertisement.serviceData;
    if (serviceData && serviceData.length) {
        console.log('\t       Service data: ');
        for (const i in serviceData) {
            console.log('\t\t\t    ', serviceData[i]);
        }
    }
    console.log('\n');
});
