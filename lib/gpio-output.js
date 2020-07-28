/*!
 * array-gpio/gpio-output.js
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const rpi = require('./rpi.js');

/* OnOff helper function */
function OnOff(pin, c, t, cb){
  let state;
  if(c === 1 || c === true){
    rpi.write(pin, 1); // returns 1
    state = true;
    if(t === 'w'){
    	state = 1;
    } 
  }
  else{ // c === 0 || c === false
    rpi.write(pin, 0); // returns 0
    state = false;
    if(t === 'w'){
    	state = 0;
    }
  }
  if(cb){
    setImmediate(cb, state);
  }
  return state;
}

/* pulse helper function */
function startPulse(pin, c, t, cb){
	rpi.write(pin, 1);
  setTimeout( function() {
    rpi.write(pin, 0);
    if(cb){
      setImmediate(cb, false);
    }
  }, t);
}

/* internal gpio control function */
function OutputPinControl(pin, c, t, cb) {
  // pulse  
  if(c === null && t){
    return startPulse(pin, c, t, cb);
  }
  // on/off control
  else if(t){
    return setTimeout( function() {
      OnOff(pin, c, t, cb);
    }, t);
  }
  else{
    return OnOff(pin, c, t, cb);
  }
}

/*
 * Gpio output class module
 */
class GpioOutput {

constructor(i, pin, o ){
  this._index = i;
  this.pin = pin;
  
  this.stop = 0;
  this.start = 0;
  this.pulseRef = null;
  this.pulseStarted = false;

  this.loopStop = 0;
  this.loopStart = 0;
  this.loopRef = null;
  this.loopStarted = false;

  this.delayOn = this.on;
  this.delayOff = this.off;

  //this.pulse = this.startPulse;
  //this.loop = this.processLoop;
}

open(){
  rpi.open(this.pin, 1);
  return this.state;
}

close(){
  rpi.close(this.pin);
  return this.state;
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

write (bit, cb){
  if(arguments.length === 0){
    throw new Error('missing control bit argument');
  }
  else if(arguments.length === 1){
    if((typeof arguments[0] === 'number' && arguments[0] < 2 ) || typeof arguments[0] === 'boolean'){
      return OutputPinControl(this.pin, bit, 'w', null);
    }
    throw new Error('invalid control bit argument');
  }
  else{ 
    if((typeof arguments[0] === 'number' || typeof arguments[0] === 'boolean') && arguments[1] instanceof Function){
      return OutputPinControl(this.pin, bit, 'w', cb);
    }
    throw new Error('invalid argument');
  }
}

on(t, cb){
  if(arguments.length === 0){
    return OutputPinControl(this.pin, 1, 0, null);
  }
  else if(arguments.length === 1){
    if(typeof arguments[0] === 'number' || arguments[0] === undefined){
      return OutputPinControl(this.pin, 1, t, null);
    }
    if(arguments[0] instanceof Function){
      return OutputPinControl(this.pin, 1, t, arguments[0]);
    }
    throw new Error('invalid argument');
  }
  else{ 
    if(typeof arguments[0] === 'number' && arguments[1] instanceof Function){
      return OutputPinControl(this.pin, 1, t, cb);
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
    return OutputPinControl(this.pin, 0, 0, null);
  }
  else if(arguments.length === 1){
    if(typeof arguments[0] === 'number' || arguments[0] === undefined){
      return OutputPinControl(this.pin, 0, t, null);
    }
    if(arguments[0] instanceof Function){
      return OutputPinControl(this.pin, 0, t, arguments[0]);
    }
    throw new Error('invalid argument');
  }
  else{
    if(typeof arguments[0] === 'number' && arguments[1] instanceof Function){
      return OutputPinControl(this.pin, 0, t, cb);
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
  let pwError = 'invalid pulse width time duration';
  this.on();
  if(arguments.length === 0){
    throw new Error(pwError);
  }
  else if(arguments.length === 1){
    if(typeof arguments[0] === 'number'){
      return OutputPinControl(this.pin, null, t, null);
    }
    throw new Error(pwError);
  }
  else { 
    if(typeof arguments[0] === 'number' && arguments[1] instanceof Function){
      return OutputPinControl(this.pin, null, t, cb);
    }
    if(typeof arguments[0] !== 'number' && arguments[1] instanceof Function){
      throw new Error(pwError);
    }
    if(typeof arguments[0] === 'number' && !(arguments[1] instanceof Function)){
      throw new Error('invalid callback argument');
    }
    throw new Error('invalid arguments');
  }
}

} 
// end of class GpioOutput

module.exports = GpioOutput;

