'use strict';
process.title = 'ambient-playbulb';
process.env.NODE_ENV = 'production';

const noble = require('noble-uwp');
const getColor = require('screen-avg-color');
const nodeCleanup = require('node-cleanup');

const SERVICE_UUID = 'ff06';
const CHARACTERISTIC_UUID = 'fffc';
const SATURATION = 0;
const peripheralIdOrAddress = process.argv.length >= 3 ? process.argv[2].toLowerCase() : null;

let colorHandler = null;
let exiting = false;

if (!peripheralIdOrAddress) {
    console.error('Peripheral ID missing');
    process.exit(9);
}

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
            console.debug('  TX Power Level    = ' + txPowerLevel);
        }

        if (manufacturerData) {
            console.debug('  Manufacturer Data = ' + manufacturerData.toString('hex'));
        }

        if (serviceData) {
            console.debug('  Service Data      = ' + JSON.stringify(serviceData, null, 2));
        }

        if (serviceUuids) {
            console.debug('  Service UUIDs     = ' + serviceUuids);
        }

        init(peripheral);
    }
});


function init(peripheral) {
    peripheral.once('disconnect', () => {
        console.warn('Disconnected');
        colorHandler = null;

        if (!exiting) noble.startScanning();
    });

    peripheral.connect(err => {
        if (err) console.error(err);
        else console.log('Connected');

        peripheral.discoverSomeServicesAndCharacteristics([SERVICE_UUID], [CHARACTERISTIC_UUID], (err, services, characteristics) => {
            if (err) console.error(err);
            else console.debug('Services discovered: ' + characteristics.length);

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

function setWhiteLevel(value = 0, cb = null) {
    if (!colorHandler) {
        if (cb) cb();
        return;
    }

    const colorData = Buffer.from([value, 0, 0, 0]);

    colorHandler.write(colorData, true, err => {
        if (err) console.error(err);
        if (cb) cb();
    });
}

nodeCleanup((exitCode, signal) => {
    exiting = true;

    setWhiteLevel(0, () => {
        if (colorHandler) {
            noble.disconnect(colorHandler._peripheralId);
            colorHandler = null;
        }

        process.kill(process.pid, signal);
    });

    nodeCleanup.uninstall();

    return false;
});
