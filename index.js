'use strict';
process.title = 'ambient-playbulb';
process.env.NODE_ENV = 'production';

const noble = require('noble-uwp');
const getColor = require('screen-avg-color');

const peripheralIdOrAddress = process.argv[2].toLowerCase();
const SERVICE_UUID = 'ff06';
const CHARACTERISTIC_UUID = 'fffc';
const SATURATION = 0;

noble.on('stateChange', state => {
    if (state === 'poweredOn') {
        noble.startScanning();
    } else {
        noble.stopScanning();
        colorHandler = null;
    }
});

noble.on('discover', peripheral => {
    if (peripheral.id === peripheralIdOrAddress || peripheral.address === peripheralIdOrAddress) {
        noble.stopScanning();

        console.log('Peripheral with ID ' + peripheral.id + ' found');
        const advertisement = peripheral.advertisement;

        const localName = advertisement.localName;
        const txPowerLevel = advertisement.txPowerLevel;
        const manufacturerData = advertisement.manufacturerData;
        const serviceData = advertisement.serviceData;
        const serviceUuids = advertisement.serviceUuids;

        if (localName) {
            console.debug('  Local Name        = ' + localName);
        }

        if (txPowerLevel) {
            console.log('  TX Power Level    = ' + txPowerLevel);
        }

        if (manufacturerData) {
            console.log('  Manufacturer Data = ' + manufacturerData.toString('hex'));
        }

        if (serviceData) {
            console.log('  Service Data      = ' + JSON.stringify(serviceData, null, 2));
        }

        if (serviceUuids) {
            console.log('  Service UUIDs     = ' + serviceUuids);
        }

        init(peripheral);
    }
});

let colorHandler = null;
function init(peripheral) {
    peripheral.once('disconnect', () => {
        console.warn('Peripheral disconnected');
        colorHandler = null;
        noble.startScanning();
    });

    peripheral.connect(err => {
        if (err) console.error(err);

        peripheral.discoverSomeServicesAndCharacteristics([SERVICE_UUID], [CHARACTERISTIC_UUID], (err, services, characteristics) => {
            if (err) console.error(err);

            colorHandler = characteristics.find(c => c.uuid === CHARACTERISTIC_UUID);

            matchCurrentScreenColor();
        });
    });
}

function matchCurrentScreenColor() {
    if (!colorHandler) return;

    getColor((err, r, g, b) => {
        if (!colorHandler) return;
        process.title = 'ambient-playbulb R: ' + r + ' G: ' + g + ' B: ' + b;

        const colorData = Buffer.from([SATURATION, r, g, b]);

        colorHandler.write(colorData, true, err => {
            if (err) console.error(err);

            matchCurrentScreenColor();
        });
    });
}
