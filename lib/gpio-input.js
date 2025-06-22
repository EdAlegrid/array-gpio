/*!
 * array-gpio/gpio-input.js
 *
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const rpi = require('./rpi.js');

const watchPinEvent = [];

class GpioInput {

#pin = 0;
#index = 0;

#open(pin) {
	rpi.gpio_open(pin, 0);
}

constructor(pin, i, o){
	this.#pin = pin;
	this.#index = i;
	this.#open(pin);
      
	if(o.pud === 0 || o.pud === 1 || o.pud === 'pd' || o.pud === 'pu'){
	    this.setPud(o.pud);
	}
}

close() {
	rpi.gpio_close(this.#pin); 
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
	return s;
}

// rpi 4 only
getPud(){
	let pud = rpi.gpio_get_pud(this.#pin);
	if(pud === 0){ 		// no pull resistor
		return null;
	}
	else if(pud === 1){ // pull-up
		return 1;
	}
	else if(pud === 2){ // pull-down
		return 0;
	}
	else{
		return 'n/a'; // not available
	}
}

setPud(pud){
	if(pud === null || pud === undefined ) {
		rpi.gpio_set_pud(this.#pin, 0); // no pull resistor
	} 
	else if(pud === 0 || pud === 'pd') {
		rpi.gpio_set_pud(this.#pin, 1); // pull-down
	}
	else if(pud == 1 || pud === 'pu') {
		rpi.gpio_set_pud(this.#pin, 2); // pull-up
	}
	else{
		throw new Error('Invalid pull resistor select');
	}	
}

watchPin(edge, cb, td){
	const pin = this.#pin;
	let on = false; 

	if(typeof edge === 'function' && typeof cb === 'number'){
		td = cb; 
		cb = edge;
		edge = null;
	}
	else if(typeof edge === 'function' && cb === undefined){
		cb = edge;
		edge = null;
	}
	else if(typeof edge !== 'string' && typeof edge !== 'number' && edge !== null ){
		console.log('invalid input watch edge argument');
		process.exit(1);
	}
	else if ((typeof edge === 'string' || typeof edge === 'number')  && typeof cb !== 'function'){
		console.log('invalid input watch callback argument');
		process.exit(1);
	}

    	const watch_pin_state = () => {
		let pin_state = rpi.gpio_read(pin);

		if(pin_state && !on){
			on = true;
			if(edge === 1 || edge === 're' || edge === 'both' ||  edge === null ){
				setImmediate(cb, true, pin);
			}
		}
		else if(!pin_state && on){
			on = false;
			if(edge === 0 || edge === 'fe' || edge == 'both' || edge === null){  
				setImmediate(cb, false, pin);
			}
		}
	}

	if(!td){
		td = 100;
	} 

	let monInt = setInterval(watch_pin_state, td);
	watchPinEvent.push({monInt:monInt, pin:pin});
}

unwatchPin(){
	const pin = this.#pin;
	watchPinEvent.forEach((monData, x) => {
		if(monData.pin === pin){
			clearInterval(monData.monInt);
			if(monData.monInt._destroyed){
				try{
					watchPinEvent.splice(x, 1);
				}
				catch(e){
					console.log('gpio_unwatch error:', e);
				}
			}
		}
	});
}

setR = this.setPud; // for compatibility with old versions 4/25/25

watch = this.watchPin;
unwatch = this.unwatchPin;

} 

module.exports = GpioInput;
 

 


 
