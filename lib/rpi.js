/*!
 * array-gpio/rpi.js
 *
 * Copyright(c) 2017 Ed Alegrid <ealegrid@gmail.com>
 * MIT Licensed
 */

'use strict';

const fs = require('node:fs');
const { arch } = require('node:process');
const cc = require('bindings')('node_rpi'); 

var rpi_board_rev = null, rpi_model = null, eventStarted = null, BcmPin = [];
var rpiInit = { initialized:false, gpio:false, pwm:false , i2c:false , spi:false, gpiomem:false, devmem:false };

if(arch === 'arm' || arch === 'arm64'){
  	// continue
}
else{
  	console.log('Sorry, array-gpio has detected that your device is not a Raspberry Pi.\narray-gpio will only work in Raspberry Pi devices.\n');
  	throw new Error('Device is not a raspberry pi');
}

function get_rpi_model(){
	let model = null, match = null; 
	try{
		let info = fs.readFileSync('/proc/cpuinfo');
		info.toString().split(/\n/).forEach((line) => {
			model = line.match(/^Model.*(.{4})/);
            		if(model){   
		    		//rpi_model = model[0].slice(8, 30); // e.g. Raspberry Pi 4 Model
		        	rpi_model = model[0].slice(18, 24).trim(); // e.g. Pi 4
		    	}
            		match = line.match(/^Revision.*(.{4})/);
			if(match) {
				rpi_board_rev = parseInt(match[1], 16);
			}
		});
	}
	catch(e){
		console.log("fs.readFileSync('/proc/cpuinfo')", e.message);
	}
}
get_rpi_model();

/*
 * Note: This module only supports 40-pin Raspberry Pi Models.
 * Below is the BCM GPIOxx pin numbering to the physical board header (40-pins) pinout map.  
 * -1 indicates a power supply or a ground pin.  
 */
const rpi_pin_map = [
	// BCM GPIOxx	Physical Board Header (*ground or power supply)
	-1,
	-1, -1,			// *1   *2  
	 2, -1,			//  3   *4  
	 3, -1,			//  5   *6  
	 4, 14,			//  7    8  
	-1, 15,			// *9    10 
	17, 18,			//  11   12 
	27, -1,			//  13  *14 
	22, 23,			//  15   16 
	-1, 24,			// *17   18 
	10, -1,			//  19  *20 
	 9, 25,			//  21   22 
	11,  8,			//  23   24 
	-1,  7,			// *25   26 
	 0,  1,			//  27   28 
	 5, -1,			//  29  *30 
	 6, 12,			//  31 	 32 
	13, -1,			//  33  *34 
	19, 16,			//  35   36 
	26, 20,			//  37 	 38 
	-1, 21			// *39   40 
]

// gound pins	
const gnd = [6, 9, 14, 20, 25, 30, 34, 39];
// 3.3 V pins	
const p3 = [1, 17];
// 5.0 V pins	
const p5 = [2, 4];

function checkInvalidPin(pin){
	if(gnd.includes(pin)) {
		throw new Error('*Ground header pin ' + pin + '\n');
	}
	if(p3.includes(pin)) {
		throw new Error('*3.3 power supply header pin ' + pin + '\n');
	}  
	if(p5.includes(pin)) {
		throw new Error('*5 power supply header pin ' + pin + '\n');
	} 
	if(pin === 0 || pin < 0 || pin > 40){
		throw new Error('*Out-of-range (1 ~ 40 only) header pin ' + pin + '\n');
	}
}

/* Convert board header pin number to BCM (Broadcom) pin number */
function header_to_bcm(pin) 
{
	try{
		if(BcmPin[pin]) {
  			return BcmPin[pin];
  		}

        	checkInvalidPin(pin);

  		if (rpi_pin_map[pin] === -1){
  			throw new Error('Power supply or gound header pin ' + pin + '\n');
  		}

		BcmPin[pin] = rpi_pin_map[pin];
		return BcmPin[pin];
    	}
    	catch(e){
        	console.log('Invalid pin', pin);
        	console.log(e.message);
		process.exit(1);
    	}
}

function validate_pins(pin){
	let currentPin = null;
	try{
		if(pin[0] === undefined){
            		currentPin = pin[0];
			throw new Error('*Cannot set input/output gpio w/o pecified pins\n');
		}
        	if(typeof pin[0] === 'object'){
			currentPin = pin[0];
			if(!pin[0].pin || pin[0].pin[0] == undefined){
				throw new Error('*createGpio - pin property is empty!\n')
			}
			pin = pin[0].pin;	
		}
		pin.forEach((_pin, x) => {
			currentPin = _pin;
			checkInvalidPin(_pin);
		});
	}
	catch(e){
		console.log('\nInvalid pin', currentPin);
		console.log(e.message);
		process.exit(1);
	}
}

/* Check if the pin is being used by another application using '/sys/class/gpio/gpio' */
function check_sys_gpio(bcm_pin, pin)
{
  	fs.stat('/sys/class/gpio/gpio' + bcm_pin, (err, stats) => {
    	if(err) {
    		if(err.code === 'ENOENT'){
       			// '/sys/class/gpio/gpio' + bcm_pin file does not exist
       			return;
    		}
    		throw err;
    	}
    	if(stats){
    		// fs.writeFileSync('/sys/class/gpio/' + 'unexport', pin);
    		console.log('\n*** pin ' + pin + ' is being used in /sys/class/gpio file');
    		console.log('*** Please check if another application is using this pin');
    		throw pin;
    	}
  	});
}

function pinout(){
	console.log('Common Board Header Physical Pinout Numbers');
	let uart = {txd:8, rxd:10};
	let i2c = {sda1:3, scl1:5, sda0:27, scl0:28};
	let pwm = {pwm0:[12,32], pwm1:[33,35]};
	let spi = {mosi:19, miso:21, sclk:23, cs0:24, cs1:26};
	let eprom = {sda:27, scl:28};
	let gpio = [3,5,7,8,10,11,12,13,15,16,18,19,21,22,23,24,26,27,28,29,31,32,33,35,36,37,38,40];
	console.log('3.3v', p3);
	console.log('5v', p5);
	console.log('ground', gnd);
 	console.log('eeprom id',eprom);
 	console.log('uart', uart);
 	console.log('i2c', i2c);
 	console.log('spi', spi);
 	console.log('pwm', pwm);
 	console.log('gpio (ALT0)', gpio, '\n');
}

/***
 *  Rpi class
 *
 *  Internal low-level direct register access library
 *  Incorrect use of this functions may cause hang-up/file corruptions  	
 *
 * Note: gpio is using 'dev/gpiomem' and i2c, spi, pwm is using 'dev/mem'
 * 1 - Start gpio only, then load all other peripherals together (i2c, spi, pwm) on demand
 * 0 - Start gpio first, then load each peripheral individually on demand (default) 
 */
var clock1 = 250000000;
var clock2 = 400000000;

class Rpi {

constructor (init){
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

    	if(init === 1){
        	this.rpi_init_access = 1; 
    	}
	else if(init == 0){
		this.rpi_init_access = 0; 
	}
}

/* Explicit initialization of rpi lib */
rpi_init (access) 
{
	cc.rpi_init(access);
	this.rpi_init_access = 1;      
}

rpi_close ()
{
	return cc.rpi_close();
}

/*
 * GPIO
 */
gpio_open (pin, mode, init)
{
	//console.log('open', pin)
	let bcm_pin = header_to_bcm(pin);

	check_sys_gpio(bcm_pin, pin);

	if(this.rpi_init_access){     
		if(!rpiInit.gpiomem){
			rpiInit.gpiomem = true;
	  		cc.rpi_init(0);
		}
	} 
	else{
		if(!rpiInit.gpio){
       			rpiInit.gpio = true;
			cc.gpio_init(); 
		}
    	}
 	
  	if(mode === this.INPUT){
  		let result =  cc.gpio_config(bcm_pin, this.INPUT); 
  
        	cc.gpio_set_pud(bcm_pin, this.PULL_OFF); 

   		if(init){
	 	  	cc.gpio_set_pud(bcm_pin, init);
   		}
		
   		return result;
  	}
  	else if(mode === this.OUTPUT){
   		let result  = cc.gpio_config(bcm_pin, this.OUTPUT);

		cc.gpio_write(bcm_pin, this.LOW);

  		if (init){
    			cc.gpio_write(bcm_pin, init);
    		}
		
    		return result;
  	}
  	else {
   		console.log('Unsupported GPIO mode:', mode);
		process.exit(1);
  	} 
}

gpio_close (pin)
{
	let bcm_pin = header_to_bcm(pin);
	cc.gpio_config(bcm_pin, this.INPUT);
	cc.gpio_set_pud(bcm_pin, this.PULL_OFF);
}

gpio_get_bcm(){
	return BcmPin;
}

gpio_enable_async_rising_pin_event(pin)
{
	let bcm_pin = header_to_bcm(pin);
	cc.gpio_enable_async_rising_event(bcm_pin, 1); 
}

gpio_detect_input_pin_event(pin)
{
	let bcm_pin = header_to_bcm(pin);
	return cc.gpio_detect_input_event(bcm_pin);
}

gpio_reset_all_pin_events(pin)
{
	let bcm_pin = header_to_bcm(pin);
	cc.gpio_reset_all_events(bcm_pin);
}

gpio_reset_pin_event(pin)
{
	let bcm_pin = header_to_bcm(pin);
	cc.gpio_reset_event(bcm_pin);
}

gpio_write (pin, value)
{
	let bcm_pin = header_to_bcm(pin);
	return cc.gpio_write(bcm_pin, value);
}

gpio_read (pin)
{
	let bcm_pin = header_to_bcm(pin);
	return cc.gpio_read(bcm_pin);
}

gpio_set_pud (pin, pud)
{
	let bcm_pin = header_to_bcm(pin);
	cc.gpio_set_pud(bcm_pin, pud);
}

gpio_get_pud (pin)
{
	let bcm_pin = header_to_bcm(pin);
	return cc.gpio_get_pud(bcm_pin);
}

/*
 * PWM
 */
pwm_init()
{
	if(this.rpi_init_access){ 
		if(!rpiInit.devmem){
			rpiInit.devmem = true;
			cc.rpi_init(1); 
		}
	}
	else{
		if(!rpiInit.pwm){
			rpiInit.gpio = true;
			rpiInit.pwm = true;
			cc.pwm_init();
		}
	}  
}

pwm_reset_pin (pin)
{
  	let bcm_pin = header_to_bcm(pin);
   	cc.pwm_reset_pin(bcm_pin);
}

pwm_reset ()
{
 	cc.pwm_reset_all_pins();
}

/*
 * Available pins for PWM - RPi 3 / RPi 4
 * PHY pin  BCM GPIO pin
 *    12         18
 *    32         12
 *    33         13
 *    35         19 
 */
pwm_setup (pin, start, mode)
{
	let bcm_pin = header_to_bcm(pin);

 	check_sys_gpio(bcm_pin);

 	/* true - enable pwm, false - disable */
	if(arguments[1] === undefined && start === undefined) {
	 	start = false; 
 	}
 	/* true for m/s mode, false for balanced mode */
 	if(arguments[2] === undefined && mode === undefined) {
 		mode = true; 
 	}
	//console.log('pin', pin, 'start', Number(start), 'mode', Number(mode));

	cc.pwm_set_pin(bcm_pin);
  	cc.pwm_set_mode(bcm_pin, Number(mode));
  	cc.pwm_enable(bcm_pin, Number(start));
}

pwm_set_clock_divider (divider)
{
 	return cc.pwm_set_clock_freq(divider);
}

pwm_set_range (pin, range)
{
	let bcm_pin = header_to_bcm(pin);
  	return cc.pwm_set_range(bcm_pin, range);
}

pwm_set_data (pin, data)
{
	let bcm_pin = header_to_bcm(pin);
  	return cc.pwm_set_data(bcm_pin, data);
}

/*
 * I2C
 *
 * pinSet 0, use SDA0 and SCL0 pins (disabled) 	
 * pinSet 1, use SDA1 and SCL1 pins (default)
 */
i2c_start(pinSet)
{
	if(this.rpi_init_access){ 
		if(!rpiInit.devmem){
			rpiInit.devmem = true;
			cc.rpi_init(1); 
			cc.spi_start();
		}
	}
	else{
	  	if (!rpiInit.i2c){
			rpiInit.gpio = true;
			rpiInit.i2c = true;
			cc.i2c_start(pinSet);
		}
	}
}

i2c_set_slave_address (addr)
{
 	return cc.i2c_select_slave(addr);
}

i2c_set_clock_divider (divider)
{
	cc.i2c_set_clock_freq(divider);
}

i2c_set_baud_rate (baud)
{
 	return cc.i2c_data_transfer_speed(baud);
}

i2c_read (buf, len)
{
	try{
		if (len === undefined){
			len = buf.length;
		}
		if (len > buf.length){
			throw new Error('Insufficient buffer size');
		}
		return cc.i2c_read(buf, len);
	}
	catch(e){
		console.log(e);
	}
}

i2cByteRead ()
{
	return cc.i2c_byte_read();
}

i2c_write (buf, len)
{
	try{
		if (len === undefined){
			len = buf.length;
		}
		if (len > buf.length){
			throw new Error('Insufficient buffer size');
		}
		return cc.i2c_write(buf, len);
	}
	catch(e){
		console.log(e);
	}
}

i2c_stop ()
{
	cc.i2c_stop();
}

/*
 * SPI
 */
spi_get_board_rev ()
{
	return { model:rpi_model, rev:rpi_board_rev.toString(16) };
}

spi_start()
{
	if(this.rpi_init_access){
		if(!rpiInit.devmem){
			rpiInit.devmem = true;
			cc.rpi_init(1);
			cc.spi_start();
		}
	}
	else{
		if (!rpiInit.spi){
			rpiInit.gpio = true;
			rpiInit.spi = true;
	  		cc.spi_start();
		}
	}
}

spi_chip_select (cs)
{
	cc.spi_chip_select(cs);
}

spi_set_cs_polarity (cs, active)
{
 	cc.spi_set_chip_select_polarity(cs, active);
}

spi_set_clock_freq (div)
{
	let freq = null;
	try{
		if ((div % 2) !== 0 || div < 0 || div > 65536){
			throw new Error('Clock divider must be an even number between 0 and 65536');
		}

		if( rpi_model === 'Pi 3' || rpi_model === 'Pi 4'){ 
			freq = Math.round(clock2/div);
		}
		else{
			freq = Math.round(clock1/div);
		}

	  	let Freq = freq/1000;

	  	console.log('SPI clock freq: ' + Freq + ' kHz (div ' + div +')');

	  	cc.spi_set_clock_freq(div);
    	}
	catch(e){
		console.log(e);
    	} 
}

spi_set_data_mode (mode)
{
	cc.spi_set_data_mode(mode);
}

spi_data_transfer (wbuf, rbuf, len) 
{
	cc.spi_data_transfer(wbuf, rbuf, len);
}

spi_write (wbuf, len) 
{
	cc.spi_write(wbuf, len);
}

spi_read (rbuf, len) 
{
	cc.spi_read(rbuf, len);
}

spi_end ()
{
 	cc.spi_stop();
}

validatePins = validate_pins;

pinout = pinout;

}

module.exports = new Rpi(0); 

process.on('exit', (code) => {
	cc.rpi_close();
});



