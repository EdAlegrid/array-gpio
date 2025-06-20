/*!
 * array-gpio
 *
 * Copyright(c) 2017 Ed Alegrid <ealegrid@gmail.com>
 * MIT Licensed
 */

'use strict';

const rpi = require('./rpi.js');
const i2c = require('./i2c.js');
const spi = require('./spi.js');
const pwm = require('./pwm.js');
const GpioInput = require('./gpio-input.js');
const GpioOutput = require('./gpio-output.js');

var d1, d2;
var outputPin = [];
var inputPin = [], inputObject = []; 
var activeGpioPins = [];

function startTime(){
 	d1 = new Date();
}

function endTime(m){
 	d2 = new Date();
 	let eT = Math.abs(d2-d1);
	if(m === undefined){
		console.log(eT + ' ms');
	}
	else if(m === 1){
		return (eT + ' ms');
	}
}

function findDuplicatePins(arr) {
  	let dup = arr.filter((item, index) => arr.indexOf(item) !== index);
    if(dup[0]){
		console.log('*** WARNING : duplicate pin detected', dup, '***' )
  	}
}

function setInputDefaultOptions(options){
	if(!options.index === undefined){
		options.index = '0~n';
	}
	if(options.event === undefined){
		options.event = false;
	}
	if(options.edge === undefined){
		options.edge = 'both'; 
	}
	if(options.pud === undefined){
        options.pud = null;
	}
	return options;
}

function createGpioSingleObject(arg, pinArray, type, options){
	let pin = arg[0];
    let gpioObject = {}; 
    let	config = '{ ' + pin + ' } '; 
	if(Number.isInteger(pin)){
		pinArray.push(pin);
		activeGpioPins.push(pin);
		if(type === 0){ 		// input
			inputPin.push(pin);
 			gpioObject = new GpioInput(pin, 0, options);
            inputObject.push(gpioObject);
		}
		else if(type === 1){ 	// output
			outputPin.push(pin);
			gpioObject = new GpioOutput(pin, 0, options); 
		}
	}
	if(type === 0){ 
		console.log('GPIO Input', config + endTime(1));
    }
    else if(type === 1){
		console.log('GPIO Output', config + endTime(1));
	}
    return gpioObject;
}

function createGpioArrayObject(pinArray, type, options){
    let pins = [];
    let objectArray = [];
    let config = '{ pin:[' + pinArray + '], index:0~n } ';
	for (let i = 0; i < pinArray.length; i++) {
		let index = i, pin = pinArray[i];
		activeGpioPins.push(pin);
        if(options.index === 'pin' || options.i === 1){
			config = '{ pin:[' + pinArray + '], index:pin } ';
			index = pinArray[i];
		}
		if(type === 0){ 		// input
			inputPin.push(pin);
            objectArray[index] = new GpioInput(pin, index, options);
			inputObject.push(objectArray[index]);
		}
		else if(type === 1){ 	// output
			outputPin.push(pin);
            objectArray[index] = new GpioOutput(pin, index, options);
		}
	}
	if(type === 0){ 
		console.log('GPIO Input', config + endTime(1));
    }
    else if(type === 1){
		console.log('GPIO Output', config + endTime(1));
	}
    return objectArray;
}

function setArrayObject1(args, pinArray, type, options){
	let pins = args[0].pin;
	for (let x = 0; x < pins.length; x++) {
		if(Number.isInteger(pins[x]) ){
			pinArray.push(pins[x]);
		}
	}
    options.i = args[0].i;
    options.index = args[0].index;
}

function setArrayObject2(args, pinArray, type, options){
	for (let x = 0; x < args.length; x++) {
		let pin = args[x];
  		if(Number.isInteger(pin) ){
			pinArray.push(pin);
 		}
		else if(args[x] === 'pin'){ 
			options.index = args[x];
		}
	}
}

function createGpio(type, pins){
	startTime();

	let gpioObject = [], gpioPins = [], options = {}; 

	pins = Array.from(pins);

	rpi.validatePins(pins);	

	if(type == 0){
		setInputDefaultOptions(options);
    }	

	//	single gpio object, e.g. r.setInput(11) or r.Output(33)
	if(Number.isInteger(pins[0]) && pins.length === 1){
        delete options.index; 
		gpioObject = createGpioSingleObject(pins, gpioPins, type, options);	
	}
    // array object type 1, e.g. r.input({pin:[pin1, pin2, pin3, ... pinN], options})
	else if(!Number.isInteger(pins[0]) && pins.length === 1) {
		setArrayObject1(pins, gpioPins, type, options)
      	gpioObject = createGpioArrayObject(gpioPins, type, options);
	}
    // array object type 2, e.g. r.output(pin1, pin2, pin3, ... pinN, options)
	else if(pins.length > 1) {
		setArrayObject2(pins, gpioPins, type, options);
        gpioObject = createGpioArrayObject(gpioPins, type, options);
	}
   		
	findDuplicatePins(activeGpioPins);	

	Object.preventExtensions(gpioObject);
	return gpioObject;
}

/******************************
 *	
 *	array-gpio class module
 *	
 ******************************/
class ArrayGpio {

constructor (){}
	
close (){
	rpi.rpi_close();
}	

watchInput (edge, cb, td){
	for (let x = 0; x < inputObject.length; x++) {
        inputObject[x].watchPin(edge, cb, td);
	}
}

unwatchInput(){
	for (let x = 0; x < inputObject.length; x++) {
        inputObject[x].unwatchPin(edge, cb, td);
	}	
}
	
/***********

	GPIO

 ***********/
setInput () {
	return createGpio(0, arguments);
}

in = this.setInput;
input = this.setInput;
Input = this.setInput;

setOutput () {
	return createGpio(1, arguments);
}

out = this.setOutput;
output = this.setOutput;
Output = this.setOutput;

/*********

	PWM

 *********/
// classic api
// e.g let pwm = new r.PWM(12)
PWM = pwm;

// w/o new 	e.g	let pwm = r.PWM(12)
PWM(pin, freq, T, pw) {
    return new spi(pin, freq, T, pw); 
}

startPWM(pin, freq, T, pw){
	return new pwm(pin, freq, T, pw); 
}

/*********

	I2C

 *********/
// classic api
// e.g let i2c = new r.I2C()
// i2c.begin() 
I2C = i2c;

// w/o new  e.g let i2c = r.I2C(pin_select)
I2C(pin_select) { 
 	return new i2c(pin_select); 
}

startI2C(pin_select) {
 	return new i2c(1);
}
	
createI2C(pinSet) {
 	return new I2C(1);
}

/*********

	SPI

 *********/
// classic api
// e.g let spi = new r.SPI() 
// spi.begin()
SPI = spi;

// w/o new  e.g let spi = r.I2C()
SPI() {
    return new spi(); 
}

setSPI() {
    return new spi(); 
}
	
startSPI() {
    return new spi(1); 
}

createSPI() {
    return new spi(1); 
}

pinout = rpi.pinout;

}

module.exports = new ArrayGpio();


