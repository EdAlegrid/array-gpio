[![Version npm](https://img.shields.io/npm/v/array-gpio.svg?logo=npm)](https://www.npmjs.com/package/array-gpio)
![Custom badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fwww.node-m2m.com%2Farray-gpio%2Fbuild-badge)

# array-gpio

**array-gpio** is a low-level javascript library for Raspberry Pi using direct register access.

It maps the ARM peripheral registers in memory using */dev/mem* for PWM, I2C, SPI
and */dev/gpiomem* for GPIO control.

One of its features is the use of *array objects* for GPIO input/output control.

### ARM Peripheral Support
- GPIO
- PWM
- I2C
- SPI

### GPIO pin numbers
All pin numbering used on this module are based on the RPI's board pinout diagram *numbers 1~40*.

<br>

<!--For IoT or machine-to-machine applications, please check [m2m](https://www.npmjs.com/package/m2m) using array-gpio.-->

# Table of contents
1. [Supported Raspberry Pi Devices](https://github.com/EdAlegrid/array-gpio#supported-raspberry-pi-devices)
2. [Node.js version requirement](https://github.com/EdAlegrid/array-gpio#nodejs-requirements)
3. [Supported OS](https://github.com/EdAlegrid/array-gpio#supported-os)
4. [Installation](https://github.com/EdAlegrid/array-gpio#installation)
5. [Quick Tour](https://github.com/EdAlegrid/array-gpio#quick-tour)
    - [Creating a GPIO input and output object](https://github.com/EdAlegrid/array-gpio#example-1)
    - [Monitoring the state of a GPIO input object](https://github.com/EdAlegrid/array-gpio#example-2)
    - [Using *isOn* and *isOff* to get the current state of a GPIO input/output object](https://github.com/EdAlegrid/array-gpio#example-3)
    - [Monitoring multiple GPIO input objects](https://github.com/EdAlegrid/array-gpio#example-4)
    - [Turning *on* and *off* a GPIO output with a *delay*](https://github.com/EdAlegrid/array-gpio#example-5)
    - [Create a GPIO input/output array object](https://github.com/EdAlegrid/array-gpio#example-6)
    - [Create a GPIO output pulse](https://github.com/EdAlegrid/array-gpio#example-7)
6. [API](https://github.com/EdAlegrid/array-gpio#api)
    - [GPIO](https://github.com/EdAlegrid/array-gpio#gpio)
      - [Input](https://github.com/EdAlegrid/array-gpio#input-properties)
      - [Output](https://github.com/EdAlegrid/array-gpio#output-properties)
    - [PWM](https://github.com/EdAlegrid/array-gpio#pwm)
    - [I2C](https://github.com/EdAlegrid/array-gpio#i2c)
    - [SPI](https://github.com/EdAlegrid/array-gpio#spi)


### Supported Raspberry Pi Devices
* Model: Pi Zero & Zero W, Pi 3 Model B+, Pi 4, Compute Module 3 & 4 (Generally most of the 40-pin models)

### Supported OS
- Raspberry Pi OS (32 and 64-bit)
- 64-bit Ubuntu 20+ (Only GPIO peripheral is supported)

### Nodejs Requirements
* Node.js version: 18.x and above (Ideally, the latest LTS version)

## Installation
```console
$ npm install array-gpio
```

