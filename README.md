# ambient-playbulb

Configured for the Mipow Playbulb (BTL201-BK) device.

# Usage
### Find out the device id
```sh
node discover
```

Example:
```
                         ID: 08324b0eace6 <08:32:4b:0e:ac:e6, public>
                       Name: null
                Connectable: true
          Manufacturer data: 4d49504f57
                       RSSI: -56
             TX power level: -2
                   Services: ["ff06"]
               Service data:
                             { uuid: 'ff06' }
```


### Run and use the defined device
Example:
```sh
node index 08324b0eace6
```
