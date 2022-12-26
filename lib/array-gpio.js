/*!
 * array-gpio
 *
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const EventEmitter = require('events');
class StateEmitter extends EventEmitter {}
const emitter = exports.emitter = new StateEmitter();
emitter.setMaxListeners(2);

const rpi = require('./rpi.js');
const I2C = require('./i2c.js');
const SPI = require('./spi.js');
const PWM = require('./pwm.js');
const GpioInput = require('./gpio-input.js');
const GpioOutput = require('./gpio-output.js');

var pwr3 = [1,17];
var pwr5 = [2,4];
var uart = {txd:8,rxd:10};
var i2c = {sda:3,scl:5};
var pwm = {pwm0:[12,32],pwm1:[33,35]};
var spi = {mosi:19,miso:21,sclk:23,cs0:24,cs1:26};
var eprom = {sda:27,scl:28};
var ground = [6,9,14,20,25,30,34,39];
var gpio = [3,5,7,8,10,11,12,13,15,16,18,19,21,22,23,24,26,27,28,29,31,32,33,35,36,37,38,40];

/* time variables */
var d1, d2;

/* debug mode variables */
var debugState = false, debugStateAdvanced = false; 

/* PWM variables */
var pwmObjectTotal = 0, pwmPin = {c1:[], c2:[]}, pwmObject = 0;

/* GPIO setup variables */
var eventPin = [], arrayPinCheck = [];

/* watch input object container */
//var watchData = [];
 
/* GPIO option input default values */
function setOption(options){
	if(options.index === undefined){
		options.index = '0~n';
	}
	if(options.event === undefined){
		options.event = false;
	}
	if(options.edge === undefined){
		options.edge = 'both'; 
	}
	if(options.intR === undefined){
		options.intR = 'none';
	}
	if(options.pinCheck === undefined || options.pinCheck === true){
		options.pinCheck = true;
	}
	return options;
}

/* watch/monitor a gpio input pin */
function watchPin(edge, cb, pin, td){
	rpi.gpio_watchPin(edge, cb, pin, td);
}

/* unwatch a gpio input pin */
function unwatchPin(pin){
	rpi.gpio_unwatchPin(pin);
}

/* show warning msg for GPIO duplicate pin */
function duplicatePinError(pin) {
	console.log('pin ' +  pin + ' is already in used\n');  
}

/* invalid pin error handler */
function invalidPinError(pin) {
	console.log('invalid pin', pin);    
	throw new Error('invalid pin');    
}

/* debug message function */
function dmsg(x, msg, cb){
	if(x === undefined){
		console.log(msg);
	}
	else if(x === 0){
		if(debugState && !debugStateAdvanced){
			//continue
		}
	}
	else if (x === 1){ 
		if(debugState && debugStateAdvanced){
			if(msg){
				console.log(msg);
			}
		}
	}
}

/* process time functions */
function getTime(){
	var d = new Date();
	var t = d.getHours()  + ':' + d.getMinutes() + ':' +   d.getSeconds() + ':' +   d.getMilliseconds();
	return t;
}

function startTime(){
  	d1 = new Date();
}

function endTime(m){
 	d2 = new Date();
 	var eT = Math.abs(d2-d1);
	if(m === undefined){
		console.log(eT + ' ms');
	}
	else if(m === 1){
		return (eT + ' ms');
	}
}

/* Check GPIO duplicate pins */
function checkPinOnArray(arr1){
	var pinCheck = '\n*** Warning ***\nDuplicate pin detected [';
	for (var x = 0; x < arr1.length; x++) {
		for (var i = 0; i < arr1.length; i++) {
			if(x === i){
				pinCheck += ' ' + arr1[i];
				break;
			}
			else if (arr1[x] === arr1[i]) {
				pinCheck += '  *' + arr1[i];
				if(debugStateAdvanced){  
	  				dmsg(1, pinCheck + ' ]   *** Fail ***');
	  				return false
				}
				else{
	  				console.log('** warning **'); 
	  				duplicatePinError(arr1[x]);
				}
			}
		}
	}
	dmsg(1, pinCheck + ' ]   OK');
	return true;
}


/****************************************
 *					*										*
 *	array-gpio class module		*
 *					*										*
 ****************************************/
class ArrayGpio {

constructor (){
	this.in = this.setInput;
	this.input = this.setInput;
	this.Input = this.setInput;

	this.out = this.setOutput;
	this.output = this.setOutput;
	this.Output = this.setOutput;
}
	
close()
{
  	rpi.lib_close();
}	

/* watchInput - shared GPIO input monitoring method */
watchInput (edge, cb, td){

	if(typeof edge === 'function' && typeof cb === 'number'){
  		td = cb; 
  		cb = edge;
  		edge = null;
	}
	else if(typeof edge === 'function' && cb === undefined){
  		cb = edge;
  		edge = null;
	}
	else if(typeof edge !== 'string' && typeof edge !== 'number' && edge !== null){
		throw new Error('invalid edge argument');
	}
	else if ((typeof edge === 'string' || typeof edge === 'number')  && typeof cb !== 'function'){
  		throw new Error('invalid callback argument');
	}

	for (var x = 0; x < eventPin.length; x++) {
  		watchPin(edge, cb, eventPin[x], td);
	}

}

/* unwatch() method (for watchInput) */ 
unwatchInput(){
	for (var x = 0; x < eventPin.length; x++) {
		unwatchPin(eventPin[x]);
	}
}
	
/********************************************

		GPIO Methods

 ********************************************/
/*
 * GPIO setInput method
 */
setInput () {

	startTime();
	var input = [], options = {}, inputPin = [], pinCheck = true, config, arraySetup;

	if(arguments[0] === undefined || arguments[0] === null ){
  		console.log('\nsetInput() - empty argument!');
  		invalidPinError(arguments[0]);
	}

	if(typeof arguments[0] === 'string' || typeof arguments[0] === 'function' ){
  		console.log('\nsetInput() - invalid argument!');
  		invalidPinError(arguments[0]);
	}

	/* check for invalid pin arguments - empty {} or {pin:[]} */
	if(typeof arguments[0] === 'object' && (arguments[0].pin === undefined || arguments[0].pin[0] == undefined)){
  		console.log('\nsetInput({pin:[]}) - array pin property is empty!');
  		invalidPinError(arguments[0]);
	}

	/*
	 *	barebone single input object
	 *	r.setInput(11);
	 */
	if(Number.isInteger(arguments[0]) && arguments.length === 1) {
		var pin = arguments[0];
		try{
			rpi.gpio_open(arguments[0], 0);
			inputPin.push(arguments[0]);
			eventPin.push(arguments[0]);
			arrayPinCheck.push(arguments[0]); 
			config = '{ pin:' + inputPin + ' } ' + endTime(1);
			console.log('GPIO Input', config);
			return new GpioInput(0, pin, {});
		}
		catch(e){
			return invalidPinError(arguments[0]);
		}
	}

	/* 
	 * array object
	 * r.input({pin:[pin1, pin2, pin3, ... pinN], options})
	 */
	if(!Number.isInteger(arguments[0]) && typeof arguments[0] === 'object' && arguments.length === 1) {
		for (var x = 0; x < arguments[0].pin.length; x++) {
	    	// check if pins are from numbers 1 ~ 40 and validate for input use  
	    	if(Number.isInteger(arguments[0].pin[x]) && arguments[0].pin[x] > 0 && arguments[0].pin[x] < 41){
	      		try{
					rpi.gpio_open(arguments[0].pin[x], 0);
	      		}
	      		catch(e){
					inputPin.push(' *' + arguments[0].pin[x]);
					console.log('input pins [ ' + inputPin + ' ]');
					invalidPinError(arguments[0].pin[x]);
	      		}
	      		inputPin.push(arguments[0].pin[x]);
	      		arrayPinCheck.push(arguments[0].pin[x]);
	    	}
	    	// invalid pin number
	    	else{
	    		invalidPinError(arguments[0].pin[x]);
	    	} 
	  	}
	  	options = arguments[0];
	}

	/* 
	 * array object
	 * r.input(pin1, pin2, pin3, ... pinN, options)
	 */
	if (Number.isInteger(arguments[0]) && arguments.length >= 1) {
		for (var x = 0; x < arguments.length; x++) {
	    	// check if pins are from numbers 1 ~ 40 and validate for input use    
	    	if(Number.isInteger(arguments[x]) && arguments[x] > 0 && arguments[x] < 41){
	      		try{
					rpi.gpio_open(arguments[x], 0);
	      		}
	      		catch(e){
					inputPin.push(' *' + arguments[x]); 
					console.log('input pins [ ' + inputPin + ' ]');
					invalidPinError(arguments[x]);
	      		}
	      		inputPin.push(arguments[x]);
	      		arrayPinCheck.push(inputPin[x]);
	    	}
			// invalid pin number
			else if(Number.isInteger(arguments[x]) && arguments[x] <= 0 || arguments[x] > 40){
				invalidPinError(arguments[x]);
			}
			else if(arguments[x] === 're' || arguments[x] === 'fe'){
				options.edge = arguments[x];
			}
			else if(arguments[x] === 'pu' || arguments[x] === 'pd'){
				options.intR = arguments[x];
			}
			else if(arguments[x] === true || arguments[x] === false){
				options.event = arguments[x];
			}
			else if(arguments[x] === 'PinAsIndex'){
				options.index = arguments[x];
			}
			else if(arguments[x] === 'NoPinCheck'){
				options.pinCheck = arguments[x];
				pinCheck = false;
			} 
			else if(arguments[x] instanceof Object ){ 
	      			options = arguments[x];
	    		}
	    		else {
	      			console.log('Invalid arguments',  arguments[x]);
	    		}
	  	} // for
	}

	setOption(options); 

	/*
	 * function to create an input array object
	 */
	function createObject(inputPin, options, GpioInput){
		for (var i = 0; i < inputPin.length; i++) {
	    	var index = i, pin = inputPin[i];
	    	if(options){
	    		if(options.pinCheck === 'NoPinCheck' || options.pinCheck === false){
					pinCheck = false;
	    		}
	    		if(options.index === 'PinAsIndex' || options.index === 'pin'){
					index = inputPin[i];
	    		}
	    		eventPin.push(pin);
	    		input[index] = new GpioInput(index, pin, options); 
	   		}
	  	}
	}
	createObject(inputPin, options, GpioInput);

	/* check for duplicate pins */
	if(debugState || debugStateAdvanced){  
		arrayPinCheck = [];
	}
	else if(pinCheck){  
		checkPinOnArray(arrayPinCheck);
	}

	if(inputPin.length > 1) { 
		arraySetup = options.index;
	  	config = '{ pin:[' + inputPin + ']' + ', index:' + options.index + ' } ' + endTime(1);
	  	if(options.array){
	    	config = '{ pin:[' + inputPin + ']' + ', array:true, index:' + options.index + ' } ' + endTime(1);
	  	}
	}
	else if(inputPin.length < 2 && options.array === true && (options.index === 'PinAsIndex' || options.index === 'pin')){
		config = '{ pin:[' + inputPin + '], array:true, index:pin } ' + endTime(1);
	}
	else if(inputPin.length < 2 && options.array === true ){
		config = '{ pin:[' + inputPin + '], array:true, index:0~n } ' + endTime(1);
	}
	else{
		config = '{ pin:' + inputPin + ' } ' + endTime(1);
	}

	/* INPUT GPIO config output */
	console.log('GPIO input ', config);

	Object.preventExtensions(input);

	return input;

} // end of setInput

/*
 * GPIO setOutput method property
 */
setOutput () {

	startTime();

	var output = [], outputPin = [], options = {}, pinCheck = true, config, arraySetup;

	if(arguments[0] === undefined || arguments[0] === null ){
		console.log('\nsetOutput() - empty argument!');
  		invalidPinError(arguments[0]);
	}

	if(typeof arguments[0] === 'string' || typeof arguments[0] === 'function' ){
	  	console.log('\nsetOutput() - invalid argument!');
	  	invalidPinError(arguments[0]);
	}

	/* check for invalid arguments - empty {} or {pin:[]} */
	if(typeof arguments[0] === 'object' && (arguments[0].pin === undefined || arguments[0].pin[0] == undefined)){
	  	console.log('\nsetOutput({pin:[]}) - array pin property is empty!');
	  	invalidPinError(arguments[0]);
	}

	/* 
	 * barebone single output object
	 * r.setOutput(33);
	 */
	if(Number.isInteger(arguments[0]) && arguments.length === 1 && arguments[0] > 0 && arguments[0] < 41) {
		var pin = arguments[0];
		try{
			rpi.gpio_open(arguments[0] , 1);
			outputPin.push(arguments[0]);
			arrayPinCheck.push(arguments[0]);
			config = '{ pin:' + outputPin + ' } ' + endTime(1);
			console.log('GPIO Output', config);
			return new GpioOutput(0, pin, {}); 
		}
		catch(e){
			return invalidPinError(arguments[0]);
		}
	}

	/* 
	 * array object
	 * r.output({pin:[pin1, pin2, pin3, ... pinN], options})
	 */
	if(!Number.isInteger(arguments[0]) && typeof arguments[0] === 'object' && arguments.length === 1) {
		for (var x = 0; x < arguments[0].pin.length; x++) {
			// check if pins are from numbers 1 ~ 40 and validate for output use   
	    	if(Number.isInteger(arguments[0].pin[x]) && arguments[0].pin[x] > 0 && arguments[0].pin[x] < 41){
	      		try{
					rpi.gpio_open(arguments[0].pin[x] , 1); 
	      		}
			    catch(e){
					outputPin.push(' *' + arguments[0].pin[x]);
					console.log('output pins [ ' + outputPin + ' ]');
					invalidPinError(arguments[0].pin[x]);
			    }
			    outputPin.push(arguments[0].pin[x]);
			    arrayPinCheck.push(arguments[0].pin[x]);
	    	}
			// invalid pin number
	    	else{
	      		invalidPinError(arguments[0].pin[x]);
	    	} 
	  	} 
	  	options = arguments[0];
	}

	/* 
	 * array object
	 * r.output(pin1, pin2, pin3, ... pinN, options) 
	 */
	if (Number.isInteger(arguments[0]) && arguments.length >= 1) {
		for (var x = 0; x < arguments.length; x++) {
			// check if pins are from numbers 1 ~ 40 and validate for output use    
			if(Number.isInteger(arguments[x]) && arguments[x] > 0 && arguments[x] < 41 ){
				try{
					rpi.gpio_open(arguments[x], 1);
				}
				catch(e){
					outputPin.push(' *' + arguments[x]);
					console.log('output pins [ ' + outputPin + ' ]');
					invalidPinError(arguments[x]);
				}
				outputPin[x] = arguments[x]; /* direct */
				//outputPin.push(arguments[x]); /* push method */
				arrayPinCheck.push(arguments[x]);
			}
			// invalid pin number
			else if(Number.isInteger(arguments[x]) && arguments[x] <= 0 || arguments[x] > 40){
				invalidPinError(arguments[x]);
			}
			else if(arguments[x] === 'PinAsIndex'){
				options = arguments[x];
			}
			else if(arguments[x] === 'NoPinCheck'){
				options = arguments[x];
				pinCheck = false;
			} 
			else if(arguments[x] instanceof Object ){
				if(arguments[x].pinCheck === false){
					pinCheck = false;
				}
				if(arguments[x].pinCheck === true){
					pinCheck = true;
				}
				options = arguments[x];
			}
			else{ 
				console.log('Invalid arguments',  arguments[x]);
			} 
	  	}
	}

	/*
	 * function to create an output object
	 */
	function createObject(outputPin, options, GpioOutput){
		for (var x = 0; x < outputPin.length; x++) { /* Dec. 27, 2017 */
			var index = x;
			if(options){
				if(options === 'PinAsIndex' || options.index === 'pin'){
					index = outputPin[x];
				}
			}
			output[index] = new GpioOutput(index, outputPin[x]);
		}
	}
	createObject(outputPin, options, GpioOutput);

	/* check for duplicate pins */
	if(debugState || debugStateAdvanced){  
	  	arrayPinCheck = [];
	}
	else if(pinCheck) {
	  	checkPinOnArray(arrayPinCheck);
	}

	if(outputPin.length > 1) {
	  	if(options === undefined || !options.index){
		  	arraySetup = 'index:0~n';
	  	}
	  	else if(options.index && !options.array) {
	    	arraySetup = 'index:pin';
	  	}
	  	else if(options.array && !options.index) {
	    	arraySetup = 'array:true, index:0~n';
	  	}
	  	else if(options.array && options.index){
			arraySetup = 'array:true, index:pin';
	  	}
	  	config = '{ pin:[' + outputPin + '], ' + arraySetup + ' } ' + endTime(1);
	}
	else if(outputPin.length < 2 && options && options.array == true && (options.index === 'pin' || options === 'PinAsIndex')){
	  	config = '{ pin:[' + outputPin + '], array:true, index:pin } ' + endTime(1);
	}
	else if(outputPin.length < 2 && options && options.array){
	  	config = '{ pin:[' + outputPin + '], array:true, index:0~n } ' + endTime(1);
	}
	else{
	 	config = '{ pin:' + outputPin + ' } ' + endTime(1);
	}

	/* OUTPUT GPIO config output */
	console.log('GPIO output ' + config);

	Object.preventExtensions(output);

	return output;

} // end of setOutput

/* validPin helper method */
validPin (){
	var validPin = [], invalidPin = [];
	for(var x = 0; x < 41 ; x++){
		try{
			rpi.gpio_open(x, 0);
			validPin.push(x);
		}
		catch(e){
			invalidPin.push(x);
		}
	}
	console.log('GPIO valid pins', validPin);
	console.log('GPIO invalid pins', invalidPin);
}

/* debug mode setup method for test */
debug(x){
	if(x === 1){
    		debugState = true;
    		debugStateAdvanced = true;
  	}
  	return debugState;
}

/********************************************

		PWM Methods

 ********************************************/
setPWM(pin, freq, T, pw){
	if(arguments.length > 4 || arguments.length < 1){
	  	throw new Error('invalid PWM(pin, freq, T, pw) arguments');
	}
	/* arguments validation */
	if(arguments[0] === 33 || arguments[0] === 35 || arguments[0] === 12 || arguments[0] === 32){
	  	var validPin = pin;
	  	/* store validated pin in array */
	  	if(validPin === 12 || validPin === 32){
	    		pwmPin.c1.push(validPin);
	  	}
		else{
	    		pwmPin.c2.push(validPin);
	  	}
	  	/* check duplicate pins */
	  	if(pwmPin.c1.length > 1 ){
	    		if(validPin === pwmPin.c1[0]){
	      			throw new Error('\nsetPWM() error: pin ' + validPin + ' is already in use.\n');
	    		}
	  	}
	  	if(pwmPin.c2.length > 1){
	    		if(validPin === pwmPin.c2[0]){
	      			throw new Error('\nsetPWM() error: pin ' + validPin + ' is already in use.\n');
	    		}
	  	}
	}
	else{
		throw new Error('invalid setPulse() pin argument');
	}

	if(arguments[1] === 10 || arguments[1] === 100 || arguments[1] === 1000 ){
	  	var validFreq = freq;
	}
	else if(arguments[1] === undefined){
	  	var validFreq = 1;
	}
	else{
	  	throw new Error('invalid setPulse() freq argument');
	}

	/* T or range */
	if(arguments[2] > 0 || arguments[2] < 1000000 ){
	  	var validT = T;
	}
	else if(arguments[2] === undefined){
	  	var validT = 0;
	}
	else{
	  	throw new Error('invalid setPulse() period T argument');
	}
	/* pw or data */
	if(arguments[3] > 0 || arguments[3] < 1000000 ){
	  	var validPW = pw;
	}
	else if( arguments[3] === undefined){
	  	var validPW = 0;
	}
	else{
  		throw new Error('invalid setPulse() pw argument');
	}

	/* create pwm object using validated arguments */
	var pwm = new PWM(validPin, validFreq, validT, validPW);

	/* track Freq from pwm.js */
	var Freq = require('./pwm.js').Freq; 

	/* PWM setup reference console output */
	if(Freq === 10){
	  	var res = '0.1 ms';
	}
	else if(Freq === 100){
	  	var res = '0.01 ms';
	}
	else if(Freq === 1000){
	  	var res = '0.001 ms';
	}

	if(validFreq === 1){
	  	console.log('PWM setup: (pin ' + validPin + ')'); 
	}
	else{
	  	/* Freq is global, not validFreq - one freq only for all */
	  	console.log('PWM setup: pin ' + validPin + ', Freq ' + Freq + ' KHz (' + res + '), T ' + validT + ', pw ' + validPW); 
	}

	/* get the pwmObject from pwm.js */
	pwmObject = require('./pwm.js').pwmObject; 
	/* check for more than 1 peripheral and channel pairs */
	setImmediate(function(){
	  	pwmObjectTotal += 1;
		if(pwmObject === pwmObjectTotal && pwmObject > 1){
			console.log("\nArray-gpio has detected you are using more than 1 PWM peripheral."
			+ "\nAll PWM peripherals are using 1 clock oscillator.\nClock frequency is set to " + Freq + " KHz for all.\n");
		}
	  	/* pwm pin channel check */
	  	setImmediate(function(){
			/* channel 1 */
			if(pwmPin.c1.length > 1 && pwmObject > 1){
				if(pwmPin.c1[1] === validPin){
					console.log("Paired PWM peripherals (pin " + pwmPin.c1 + ") detected.");
					console.log("Range and data will be same for both peripherals.\n");
				}
			}
			/* channel 2 */
			if(pwmPin.c2.length > 1 && pwmObject > 1){
				if(pwmPin.c2[1] === validPin){
					console.log("Paired PWM peripherals (pin " + pwmPin.c2 + ") detected.");
					console.log("Range and data will be same for both peripherals.\n");
				}    
			}
	  	});
	});

	return pwm;

}

PWM(pin, freq, T, pw){
	return this.setPWM(pin, freq, T, pw);
}

startPWM(pin, freq, T, pw){
	return this.setPWM(pin, freq, T, pw);
}

/********************************************

		I2C Methods

 ********************************************/	
I2C(pin) {
  	return new I2C(pin); 
}

setI2C(pin) {
	return new I2C(pin); 
}

startI2C(pinSet) {
  	return new I2C(pinSet); 
}
	
	
/********************************************

		SPI Methods

 ********************************************/
SPI() {
	var spi = new SPI(); 
	return spi;
}

setSPI() {
	var spi = new SPI(); 
	return spi;
}
	
startSPI() {
	var spi = new SPI(); 
	return spi;
}
	
/********************************************

		Other Helper Methods

 ********************************************/	

/* mswait (millisecond) method */
mswait (ms)
{
	rpi.mswait(ms);
}

/* uswait (microsecond) method */
uswait (us)
{
  	rpi.uswait(us);
}

pinout(){
  	console.log('** common pins for rpi zero, rpi3 and rpi4 **');
  	console.log('(based on the physical pinout numbering from the board header)\n');
	console.log('5v', pwr5);
	console.log('3.3v', pwr3);
	console.log('ground', ground);
  	console.log('eeprom id',eprom);
  	console.log('uart', uart);
  	console.log('i2c', i2c);
  	console.log('spi', spi);
  	console.log('pwm', pwm);
  	console.log('gpio (ALT0)', gpio, '\n');
}

} // end of ArrayGpio class

module.exports = new ArrayGpio;



