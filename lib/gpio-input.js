/*!
 * array-gpio/gpio-input.js
 *
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const rpi = require('./rpi.js');

//var watchData = [];

/*
 * Gpio input class module
 */
class GpioInput {

constructor(i, pin, o ){
        this._index = i;
        this.pin = pin;
  
        if(o.intR === 'pu' || o.intR === 'pd' || o.intR === 1 || o.intR === 0){
                /* istanbul ignore next */
                this.intR(o.intR);
        }
        else{
                this.intR(null);
        }
        this.setR = this.intR; 
}

open () {
        rpi.open(this.pin, 0);
}

close () {
        rpi.close(this.pin); 
}

get state(){
        let state = rpi.gpio_read(this.pin);
        if(state === 1){
                return true;
        }
        else{
   	        return false;
        }
}

get isOn(){
        return this.state; 
}

get isOff(){
        return !this.state; 
}

intR (x) {
        if(x === null || x === undefined) {
                return rpi.gpio_enable_pud(this.pin, 0); 
        } 
        else if(x === 'pu' || x == 1) {
                return rpi.gpio_enable_pud(this.pin, 2); 
        }
        else if(x === 'pd' || x === 0) {
                return rpi.gpio_enable_pud(this.pin, 1);
        }
}

read(cb){
        let s = rpi.gpio_read(this.pin);

        if(arguments.length === 0){
                return s;
        }
        else if(arguments.length === 1 && typeof arguments[0] === 'function'){
                return setImmediate(cb, s);
        }
        else {
                throw new Error('invalid callback argument');
        }
}

watch(edge, cb, td){
        let pin = this.pin;
	rpi.gpio_watchPin(edge, cb, pin, td);
}

unwatch(){
        let pin = this.pin;
	rpi.gpio_unwatchPin(pin);
}
 
} // end of GpioInput class

module.exports = GpioInput;
 

 
