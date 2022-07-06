/*!
 * array-gpio/rpi.js
 * Copyright(c) 2017 Ed Alegrid <ealegrid@gmail.com>
 * MIT Licensed
 *
 */

'use strict';

const fs = require('fs');
const os = require('os');
const cc = require('bindings')('node_rpi'); 

const EventEmitter = require('events');
class StateEmitter extends EventEmitter {}
const emitter = exports.emitter = new StateEmitter();
emitter.setMaxListeners(2);

var match;
var BoardRev;
var BcmPin = {};
var inputPin = [];
var outputPin = [];
var eventStarted = null;
var rpiSetup = { initialized:false, gpiomem:false, initI2c:false , initSpi:false };

/*
 * Verify if the board is a Raspberry Pi
 */
if(os.arch() === 'arm' || os.arch() === 'arm64'){
  	//continue
}
else{
  	console.log('Sorry, array-gpio has detected that your device is not a Raspberry Pi.\narray-gpio will only work in Raspberry Pi devices.\n');
  	throw new Error('device is not a raspberry pi');
}

/*
 * Check rpi board revision.
 */
/*fs.readFile('/proc/cpuinfo', function (err, info) {
    	if (err) throw err;

    	if (!info){
		return false;
    	}

    	info.toString().split(/\n/).forEach(function (line) {
		match = line.match(/^Revision.*(.{4})/);
		if (match) {
			return BoardRev = parseInt(match[1], 16);
		}
    	});

	//console.log('BoardRev', BoardRev.toString(16));
	switch (BoardRev) {
		case 0x10:
		case 0x12:
		case 0x13:
		case 0x14:
		case 0x15:
		case 0x32:
		case 0x92:
		case 0x93:
		case 0xc1:
		case 0x1041:
		case 0x2042:
		case 0x2082:
		case 0x20d3:
		case 0x20a0:
		case 0x20e0:
		break;
		default:
		console.log('\nSorry, your raspberry pi model is not currently supported at this time.\n');
		throw new Error('unsupported rpi board');
		return false;
	}
	return true;
});*/

/*
 * This module only supports 40-pin Raspberry Pi Models.
 * 40-pin Physical/Board Layout Pin Mapping with BCM GPIOxx Pin Numbering.  
 *
 * -1 indicates a power supply or ground pin.  
 */
var pinLayout = [
	-1,
	-1, -1,		/* P1   P2  */
	 2, -1,		/* P3   P4  */
	 3, -1,		/* P5   P6  */
	 4, 14,		/* P7   P8  */
	-1, 15,		/* P9   P10 */
	17, 18,		/* P11  P12 */
	27, -1,		/* P13  P14 */
	22, 23,		/* P15  P16 */
	-1, 24,		/* P17  P18 */
	10, -1,		/* P19  P20 */
	 9, 25,		/* P21  P22 */
	11,  8,		/* P23  P24 */
	-1,  7,		/* P25  P26 */
	 0,  1,		/* P27  P28 */
	 5, -1,		/* P29  P30 */
	 6, 12,		/* P31  P32 */
	13, -1,		/* P33  P34 */
	19, 16,		/* P35  P36 */
	26, 20,		/* P37  P38 */
	-1, 21		/* P39  P40 */
]

/* Convert physical/board header pin number to BCM pin numbering */
function convertPin(pin) 
{
  	if (BcmPin[pin]) {
  		return BcmPin[pin];
  	}
  	if (pinLayout[pin] === -1 || pinLayout[pin] === null){
  		throw new Error(pin, 'is invalid!');
  	}
	BcmPin[pin] = pinLayout[pin];
	return BcmPin[pin];
}

/* Check if the pin is being used by another application using '/sys/class/gpio/gpio' */
function check_sys_gpio(gpioPin, pin)
{
  	fs.stat('/sys/class/gpio/gpio' + gpioPin, (err, stats) => {
    		if(err) {
      			if(err.code === 'ENOENT'){
        			// '/sys/class/gpio/gpio' + gpioPin file does not exist
        			return;
      			}
      			throw err;
    		}
    		if(stats){
      			//fs.writeFileSync('/sys/class/gpio/' + 'unexport', pin);
      			console.log('\n*** pin ' + pin + ' is being used in /sys/class/gpio file');
      			console.log('*** Please check if another application is using this pin');
      			throw pin;
    		}
  	});
}

/* error message for rpi mode conflict */
function rpiModeConflict(){
  	console.log('\n** Peripheral access conflict.');
  	console.log('** I2C, SPI and PWM object creation takes precedence over GPIO object creation.');
  	console.log('** Try creating I2C/SPI/PWM objects before creating GPIO input/output objects.\n');
}

/***
 *  Rpi class
 *
 *  low-level direct register access
 *  Incorrect use of this functions may cause hang-up/file corruptions  	
 */
class Rpi {
	
constructor (){
	this.LOW  = 0x0;
	this.HIGH = 0x1;

	this.INPUT  = 0x0;
	this.OUTPUT = 0x1;

	this.PULL_OFF  = 0x0;
	this.PULL_DOWN = 0x1;
	this.PULL_UP   = 0x2;

	this.FALLING_EDGE = 0x1;
	this.RISING_EDGE = 0x2;
	this.BOTH = 0x3;
}

init (access) 
{
	/* reset pin store */
  	BcmPin = {};
 	cc.rpi_init(access); 

 	if(access === 0){
		rpiSetup.gpiomem = true;  // rpi in dev/gpiomem for GPIO
  	}
	else{
		rpiSetup.gpiomem = false; // rpi in dev/mem for i2c, spi, pwm
  	}
	rpiSetup.initialized = true; // rpi must be initialized only once 
}

open (pin, mode, init)
{
	var gpioPin = convertPin(pin);
	if (!rpiSetup.initialized) {
  		this.init(0);
	}

	check_sys_gpio(gpioPin, pin);

  	/* pin initial state */     
  	cc.gpio_config(gpioPin, this.INPUT);
  	cc.gpio_enable_pud(gpioPin, this.PULL_OFF);
	
	/* set as INPUT */
  	if(mode === this.INPUT){
  		var result =  cc.gpio_config(gpioPin, this.INPUT); 
  
    		if (init){
	 	  	cc.gpio_enable_pud(gpioPin, init);
   		}
    		else{
		  	cc.gpio_enable_pud(gpioPin, this.PULL_OFF);  /* initial PUD setup, none */
    		}
		// track all input pins
    		inputPin.push(pin);
		
    		// remove duplicates
    		inputPin = inputPin.filter(function(c, index){return inputPin.indexOf(c) === index});
		
   		return result;
  	}
	/* set as OUTPUT */
  	else if(mode === this.OUTPUT){
   		var result  = cc.gpio_config(gpioPin, this.OUTPUT);
  		if (init){
    			cc.gpio_write(gpioPin, init);
    		}
    		else{
			cc.gpio_write(gpioPin, this.LOW);  /* initial state is OFF */
    		}
    		// track all output pins
    		outputPin.push(pin);
		
    		// remove duplicates
    		outputPin = outputPin.filter(function(c, index){return outputPin.indexOf(c) === index});
		
    		return result;
  	}
  	else {
   		throw new Error('Unsupported mode ' + mode);
  	} 
}

close (pin)
{
	var gpioPin = convertPin(pin);

	if (!rpiSetup.gpiomem){
  		cc.gpio_enable_pud(gpioPin, this.PULL_OFF);
  	}

  	/* reset pin to input */     
	cc.gpio_config(gpioPin, this.INPUT);
	cc.gpio_enable_pud(gpioPin, this.PULL_OFF);

	inputPin = inputPin.filter(function(item) {
		return item !== pin;
	});

	outputPin = outputPin.filter(function(item) {
		return item !== pin;
	});
} 

read (pin)
{
	return cc.gpio_read(convertPin(pin));
}

write (pin, value)
{
	return cc.gpio_write(convertPin(pin), value);
}

pud (pin, state)
{
	return cc.gpio_enable_pud(convertPin(pin), state);
}

pwmInit ()
{
	/* check if GPIO is already using the rpi library in gpiomem */
	if (rpiSetup.initialized && rpiSetup.gpiomem){ 
    		rpiModeConflict();
    		rpiSetup.gpiomem = false;
    		this.pwmReset();
		throw new Error('pwm peripheral access conflict');
  	} 
  	/* PWM peripheral requires /dev/mem */
  	if (!rpiSetup.initialized) {
  		this.init(1);
	}
}

pwmResetPin (pin)
{
  	var gpioPin = convertPin(pin);
  	var v = outputPin.indexOf(gpioPin);
  	if(v === -1){
 	  	cc.pwm_reset_pin(gpioPin);
    		this.close(gpioPin);
  	}
}

pwmReset ()
{
 	cc.pwm_reset_all_pins();
}

/*
 * PWM
 *
 * available pins for PWM - RPi 3 
 * PHY pin  BCM GPIO pin
 *    12         18
 *    32         12
 *    33         13
 *    35         19 
 */
pwmSetup (pin, start, mode)
{
	var gpioPin = convertPin(pin);

 	check_sys_gpio(gpioPin);

 	/* true - enable pwm, false - disable */
	if(arguments[1] === undefined && start === undefined) {
	 	start = false; 
 	}
 	/* true for m/s mode, false for balanced mode */
 	if(arguments[2] === undefined && mode === undefined) {
 		mode = true; 
 	}

  	cc.pwm_set_pin(gpioPin);
  	cc.pwm_set_mode(gpioPin, Number(mode));
  	cc.pwm_enable(gpioPin, Number(start));
}

pwmSetClockDivider (divider)
{
 	return cc.pwm_set_clock_freq(divider);
}

pwmSetRange (pin, range)
{
  	return cc.pwm_set_range(convertPin(pin), range);
}

pwmSetData (pin, data)
{
  	return cc.pwm_set_data(convertPin(pin), data);
}

/*
 * I2C
 */
i2cBegin ()
{
 	if(rpiSetup.initialized && rpiSetup.gpiomem){ 
  		rpiModeConflict();
		rpiSetup.gpiomem = false;
		throw new Error('i2c peripheral access conflict');
  	}
	/* I2C requires /dev/mem */
  	if (!rpiSetup.initialized){
  		this.init(1);
	}
  	rpiSetup.initI2c = true;
	return cc.i2c_start();
}
	
i2cInit (pinSet)
{
 	if(rpiSetup.initialized && rpiSetup.gpiomem){ 
  		rpiModeConflict();
		rpiSetup.gpiomem = false;
		throw new Error('i2c peripheral access conflict');
  	}	
	/* I2C requires /dev/mem */
  	if (!rpiSetup.initialized){
  		//this.init(1);
		rpiSetup.initI2c = true;
		if(pinSet === 1){
			return cc.i2c_init(1);
		}
		else if(pinSet === 1){
			return cc.i2c_init(0);
		}
	}
}
	

i2cSetSlaveAddress (addr)
{
 	return cc.i2c_select_slave(addr);
}

i2cSetClockDivider (divider)
{
	cc.i2c_set_clock_freq(divider);
}

i2cSetBaudRate (baud)
{
 	return cc.i2c_data_transfer_speed(baud);
}

i2cRead (buf, len)
{
	if (len === undefined)
		len = buf.length;

	if (len > buf.length)
		throw new Error('Insufficient buffer size');

	return cc.i2c_read(buf, len);
}

i2cByteRead ()
{
	return cc.i2c_byte_read();
}

i2cWrite (buf, len)
{
	if (len === undefined)
		len = buf.length;

	if (len > buf.length)
		throw new Error('Insufficient buffer size');

	return cc.i2c_write(buf, len);
}

i2cEnd ()
{
	cc.i2c_stop();
}

/*
 * SPI
 */
spiGetBoardRev ()
{
	return BoardRev;
}

spiBegin ()
{
 	if (rpiSetup.initialized && rpiSetup.gpiomem){
		rpiModeConflict();
		rpiSetup.gpiomem = false;
		throw new Error('spi peripheral access conflict');
	}
 
	/* SPI requires /dev/mem */
 	if (!rpiSetup.initialized) {
 		this.init(1);
	}
  	rpiSetup.initSpi = true;
  	return cc.spi_start();
}

spiChipSelect (cs)
{
	cc.spi_chip_select(cs);
}

spiSetCSPolarity (cs, active)
{
 	cc.spi_set_chip_select_polarity(cs, active);
}

spiSetClockDivider (divider)
{
	if ((divider % 2) !== 0 || divider < 0 || divider > 65536)
		throw new Error('Clock divider must be an even number between 0 and 65536');

  	cc.spi_set_clock_freq(divider);
}

spiSetDataMode (mode)
{
	cc.spi_set_data_mode(mode);
}

spiTransfer (wbuf, rbuf, len) 
{
	cc.spi_data_transfer(wbuf, rbuf, len);
}

spiWrite (wbuf, len) 
{
	cc.spi_write(wbuf, len);
}

spiRead (rbuf, len) 
{
	cc.spi_read(rbuf, len);
}

spiEnd ()
{
 	cc.spi_stop();
}

/*
 * GPIO direct register access api for testing
 *
 */	
rpi_init ()
{
	cc.rpi_init(0);
}

rpi_close ()
{
	return cc.rpi_close();
}

gpio_config (pin, mode)
{
	cc.gpio_config(convertPin(pin), mode);
}

gpio_input (pin)
{
	cc.gpio_input(convertPin(pin));
}

gpio_output (pin)
{
	cc.gpio_output(convertPin(pin));
}

gpio_read (pin)
{
	return cc.gpio_read(convertPin(pin));
}

gpio_write (pin, value)
{
	return cc.gpio_write(convertPin(pin), value);
}

gpio_enable_pud (pin, value)
{
	cc.gpio_enable_pud(convertPin(pin), value);
}

mswait (ms)
{
	cc.mswait(ms);
}

uswait (ms)
{
	cc.uswait(ms);
}

}// end of Rpi class

module.exports = new Rpi();

process.on('exit', function (code) {
	cc.rpi_close();
});

