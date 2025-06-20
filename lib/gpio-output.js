/*!
 * array-gpio/gpio-output.js
 *
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const rpi = require('./rpi.js');

function OnOff(pin, c, cb){
  	if(cb){
    	setImmediate(cb, c);
  	}
	return rpi.gpio_write(pin, c);
}

function startPulse(pin, c, t, cb){
	rpi.gpio_write(pin, 1);
    setTimeout(() => { 
    	rpi.gpio_write(pin, 0);
    	if(cb){
    		setImmediate(cb, false);
    	}
  	}, t);
}

function OutputPinControl(pin, c, t, cb) {
  	if(c === null && t){
    	return startPulse(pin, c, t, cb);
  	}
  	else if(t){
    	return setTimeout(() => {
    		OnOff(pin, c, cb);
    	}, t);
  	}
  	else{
    	return OnOff(pin, c, cb);
  	}
}

class GpioOutput {

#pin = 0;
#index = 0;

#open(pin){
	rpi.gpio_open(pin, 1);
}

constructor(pin, i, o ){
   	this.#pin = pin;
    this.#index = i;
	this.#open(pin);
}

close(){
  	rpi.gpio_close(this.#pin);
  	return this.state;
}

get pin(){
	return this.#pin;
}

get state(){
  	let state = rpi.gpio_read(this.#pin); 
  	if(state === 1){
		return true;
  	}
  	else if(state === 0){
	    return false;
	}
}
		
get isOn(){
  	return this.state; 
}

get isOff(){
  	return !this.state; 
}

read(cb){
	let s = rpi.gpio_read(this.#pin);
	if(cb){
		return setImmediate(cb, s);
	}
 	return s
}

write(bit, cb){
  	if(arguments.length === 0){
		throw new Error('missing control bit argument');
	}
  	else if(arguments.length === 1){
		if((typeof arguments[0] === 'number' && arguments[0] < 2 ) || typeof arguments[0] === 'boolean'){
  			return OutputPinControl(this.#pin, bit, null, null);
		}
		throw new Error('invalid control bit argument');
  	}
  	else{ 
		if((typeof arguments[0] === 'number' || typeof arguments[0] === 'boolean') && arguments[1] instanceof Function){
  			return OutputPinControl(this.#pin, bit, null, cb);
		}
		throw new Error('invalid argument');
  	}
}

on(t, cb){
  	if(arguments.length === 0){
		return OutputPinControl(this.#pin, 1, 0, null);
  	}
  	else if(arguments.length === 1){
		if(typeof arguments[0] === 'number' || arguments[0] === undefined){
  			return OutputPinControl(this.#pin, 1, t, null);
		}
		if(arguments[0] instanceof Function){
  			return OutputPinControl(this.#pin, 1, t, arguments[0]);
		}
		throw new Error('invalid argument');
  	}
  	else{ 
		if(typeof arguments[0] === 'number' && arguments[1] instanceof Function){
  			return OutputPinControl(this.#pin, 1, t, cb);
		}
		if(typeof arguments[0] !== 'number' && arguments[1] instanceof Function){
  			throw new Error('invalid delay argument');
		}
		if(typeof arguments[0] === 'number' && !(arguments[1] instanceof Function)){
  			throw new Error('invalid callback argument');
		}
		throw new Error('invalid arguments');
  	}
}  

off(t, cb){
  	if(arguments.length === 0){
		return OutputPinControl(this.#pin, 0, 0, null);
 	}
	else if(arguments.length === 1){
		if(typeof arguments[0] === 'number' || arguments[0] === undefined){
			return OutputPinControl(this.#pin, 0, t, null);
		}
		if(arguments[0] instanceof Function){
			return OutputPinControl(this.#pin, 0, t, arguments[0]);
		}
		throw new Error('invalid argument');
  	}
  	else{
		if(typeof arguments[0] === 'number' && arguments[1] instanceof Function){
  			return OutputPinControl(this.#pin, 0, t, cb);
		}
		if(typeof arguments[0] !== 'number' && arguments[1] instanceof Function){
  			throw new Error('invalid delay argument');
		}
		if(typeof arguments[0] === 'number' && !(arguments[1] instanceof Function)){
  			throw new Error('invalid callback argument');
		}
		throw new Error('invalid arguments');
  	}
} 

/* create a pulse with a duration of t, reverse of on() or delayOn() */
pulse(t, cb){
  	let error = 'pulse - invalid pulse width time duration';
  	this.on();
  	if(arguments.length === 0){
		throw new Error(error);
  	}
  	else if(arguments.length === 1){
		if(typeof arguments[0] === 'number'){
  			return OutputPinControl(this.#pin, null, t, null);
		}
		throw new Error(error);
  	}
  	else { 
		if(typeof arguments[0] === 'number' && arguments[1] instanceof Function){
  			return OutputPinControl(this.#pin, null, t, cb);
		}
		if(typeof arguments[0] !== 'number' && arguments[1] instanceof Function){
  			throw new Error(error);
		}
		if(typeof arguments[0] === 'number' && !(arguments[1] instanceof Function)){
  			throw new Error('pulse - invalid callback argument');
		}
		throw new Error('pulse - invalid arguments');
  	}
}

} 

module.exports = GpioOutput;


