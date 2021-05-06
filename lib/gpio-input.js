/*!
 * array-gpio/gpio-input.js
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const rpi = require('./rpi.js');

var watchData = [];

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
  let state = rpi.read(this.pin);
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
  let s = rpi.read(this.pin);

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
  let on = false;
  this.setR(0);

  if(typeof edge === 'function' && typeof cb === 'number'){
    td = cb; 
    cb = edge;
    edge = null;
  }
  else if(typeof edge === 'function' && cb === undefined){
    cb = edge;
    edge = null;
  }
  else if(typeof edge !== 'string' && typeof edge !== 'number'){
    throw new Error('invalid edge argument');
  }
  else if ((typeof edge === 'string' || typeof edge === 'number')  && typeof cb !== 'function'){
    throw new Error('invalid callback argument');
  }

  /* check pin if valid */
  /* istanbul ignore next */
  if(cb){
    try{
      rpi.read(pin);
    }
    catch(e){
      throw new Error('invalid pin');
    } 
  }

  if(!td){
    td = 100;
  }

  /* istanbul ignore next */
  function logic () {
    if(rpi.read(pin) && !on){
      on = true;
      if(edge === 1 || edge === 're' || edge === 'both' || edge === null){
        setImmediate(cb, true, pin);
      }
    }
    else if(!rpi.read(pin) && on){
      on = false;  
      if(edge === 0 || edge === 'fe' || edge === 'both' || edge === null){  
        setImmediate(cb, false, pin);
      }
    }
  }

  watchData.forEach((monData, index) => {
    if(monData.pin === pin){
      clearInterval(monData.monitor);
      watchData.splice(index,1);
    }
  });

  let monitor = setInterval(logic, td);
  let monData = {monitor:monitor, pin:pin};
  watchData.push(monData);
}

unwatch(){
  let pin = this.pin;
  watchData.forEach((monData, index) => {
    if(monData.pin === pin){
      clearInterval(monData.monitor);
      watchData.splice(index,1);
    }
  });
}
 
} // end of GpioInput class

module.exports = GpioInput;
 
