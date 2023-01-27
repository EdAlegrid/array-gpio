[![Version npm](https://img.shields.io/npm/v/array-gpio.svg?logo=npm)](https://www.npmjs.com/package/array-gpio)
![Custom badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fwww.node-m2m.com%2Farray-gpio%2Fbuild-badge)

# array-gpio

**array-gpio** is a low-level javascript library for Raspberry Pi using a direct register control.

It maps the ARM peripheral registers in memory using */dev/mem* for PWM, I2C, SPI
and */dev/gpiomem* for GPIO control.

One of its features is the use of *array objects* for GPIO input/output control.

### ARM Peripheral Support
- GPIO
- PWM
- I2C
- SPI

<br>

### GPIO pin numbers
All pin numbering used on this module are based on the RPI board's pinout diagram *numbers 1~40*.

<br>

For IoT or machine-to-machine applications, please check [m2m](https://www.npmjs.com/package/m2m) using array-gpio.

# Table of contents
1. [Supported Raspberry Pi Devices](#supported-raspberry-pi-devices)
2. [Node.js version requirement](#nodejs-requirements)
3. [Supported OS](#supported-os)
4. [Installation](#installation)
5. [Quick Tour](#quick-tour)
    - [Creating a GPIO input and output object](#example-1)
    - [Monitoring the state of a GPIO input object](#example-2)
    - [Using *isOn* and *isOff* to get the current state of a GPIO input/output object](#example-3)
    - [Monitoring multiple GPIO input objects](#example-4)
    - [Turning *on* and *off* a GPIO output with a *delay*](#example-5)
    - [Create a GPIO input/output array object](#example-6)
    - [Create a GPIO output pulse](#example-7)
6. [API](#api)
    - [GPIO](#gpio)
      - [Input](#input-properties)
      - [Output](#output-properties)
    - [PWM](#pwm)
    - [I2C](#i2c)
    - [SPI](#spi)


### Supported Raspberry Pi Devices
* Model: Pi Zero & Zero W, Pi Zero 2 W, Pi 3 Model B+, Pi 4 Model B, Compute Module 3 & 4 (Generally most of the 40-pin models)

<br>

### Supported OS
- Raspberry Pi OS (32 and 64-bit)
- Raspbian
- 64-bit Ubuntu 20+ (Only GPIO peripheral is supported)

<br>

### Nodejs Requirements
* Node.js version: 10.x, 12.x, 14.x, 16.x, 18.x (Ideally, the latest LTS version)

<br>

## Installation
```console
$ npm install array-gpio
```

# Quick Tour

## Example 1
### Create a GPIO input and output object

Connect a momentary *switch button* on pin **11** and an *led* on pin **33**.
![](https://raw.githubusercontent.com/EdoLabs/src3/master/array-gpio-quick-example1.svg?sanitize=true)

Using **in** and **out** method from *array-gpio* object module
```js
// create a raspberry pi (r) object
const r = require('array-gpio');

// set pin 11 as input
let input = r.in(11);

// set pin 33 as output
let output = r.out(33);
```

Alternatively using the object destructuring assignment pattern, you can use the **setInput** and **setOutput** methods to create your input/output objects
```js
const {setInput, setOutput} = require('array-gpio');

// set pin 11 as input
let sw = setInput(11);

// set pin 33 as output
let led = setOutput(33);
```

## Example 2
### Monitor the state of an input object

```js
const r = require('array-gpio');

let sw = r.in(11);
let led = r.out(33);

// Pressing the switch sw button, the led will turn on
// Releasing the switch sw button, the led will turn off
sw.watch((state) => {
  if(state){
    led.on();
  }
  else{
    led.off();
  }
});
```

## Example 3
### Using *isOn* and *isOff* properties to get the current state of an input/output object

The **isOn** and **isOff** properties are built-in own properties of input/output objects when they are created.
![](https://raw.githubusercontent.com/EdoLabs/src3/master/quick-example2.svg?sanitize=true)
```js
const r = require('array-gpio');

let sw = r.in(11);
let led = r.out(33);

// Check the current state of sw and led object
console.log(sw1.isOn); // false
console.log(led.isOn); // false

console.log(sw1.isOff); // true
console.log(led.isOff); // true

```

## Example 4
### Monitor multiple input objects
To monitor multiple input objects, you can use the **watchInput()** method.

Connect a momentary *switch button* on pin **11, 13, 15** and **19** and an *led* on pin **33** and **35**.
```js
const r = require('array-gpio');

let sw1 = r.in(11), sw2 = r.in(13), sw3 = r.in(15), sw4 = r.in(19);

let led1 = r.out(33), led2 = r.out(35);

// Press sw1 to turn on led1, press sw2 to turn off led1
// Press sw3 to turn on led2, press sw4 to turn off led2

// The callback argument will be invoked 
// if you press any of the input switches
r.watchInput(() => {
  if(sw1.isOn){
    led1.on();
  }
  else if(sw2.isOn){
    led1.off();
  }
  else if(sw3.isOn){
    led2.on();
  }
  else if(sw4.isOn){
    led2.off();
  }
});
```

## Example 5
### Turning *on* and *off* a GPIO output with a *delay*

Connect a momentary *switch button* on pin **11** and **13** and an *led* on pin **33**.

```js
const {setInput, setOutput, watchInput} = require('array-gpio');

let sw1 = setInput(11);
let sw2 = setInput(13);
let led = setOutput(33);

watchInput(() => {
  if(sw1.isOn){
    // pressing sw1, the led will turn on after 1000 ms or 1 sec delay
    led.on(1000);
  }
  else if(sw2.isOn){
    // pressing sw2, the led will turn off after 500 ms or 0.5 sec delay   
    led.off(500);
  }
});
```

## Example 6
### Create an input/output array object

Connect a momentary *switch button* for each input pin and an *led* for each output pin.
![](https://raw.githubusercontent.com/EdoLabs/src3/master/quick-example4.svg?sanitize=true)
```js
const r = require('array-gpio');

const sw = r.in({pin:[11, 13], index:'pin'});
const led = r.out({pin:[33, 35, 37, 36, 38, 40], index:'pin'});

// turn on all led outputs sequentially
let LedOn = () => {
  let t = 0;   // initial on time delay in ms
  for(let x in led){
    t += 50;
    led[x].on(t);
  }
}

// turn off all led outputs sequentially
let LedOff = () => {
  let t = 0; // initial off time delay in ms
  for(let x in led){
    t += 50;
    led[x].off(t);
  }
}

r.watchInput(() => {
  if(sw[11].isOn){
    LedOn();
  }
  else if(sw[13].isOn){
    LedOff();
  }
});
```
### Using forEach to iterate over the array objects
```js
const {setInput, setOutput, watchInput} = require('array-gpio');

const sw = setInput({pin:[11, 13], index:'pin'});
const led = setOutput({pin:[33, 35, 37, 36, 38, 40], index:'pin'});

let LedOn = () => {
  let t = 0;
  led.forEach((output) => {
    t += 50;
    output.on(t);
  })
}

let LedOff = () => {
  let t = 0;
  led.forEach((output) => {
    t += 50;
    output.off(t);
  })
}

watchInput(() => {
  sw.forEach((input) => {
    if(input.pin === 11 && input.isOn){
      ledOn();
    }
    else if(input.pin === 13 && input.isOn){
      ledOff();
    }    
  })
});
```

## Example 7
### Create a simple GPIO single one-shot pulse

Connect a momentary *switch button* on pin **11, 13, 15** and an *led* on pin **33**.

```js
const {setInput, setOutput, watchInput} = require('array-gpio');

let sw1 = setInput(11);
let sw2 = setInput(13);
let sw3 = setInput(15);
let led = setOutput(33);

watchInput(() => {
  // press sw1 to create a pulse with a duration of 50 ms  
  if(sw1.isOn){
    led.pulse(50);
  }
  // press sw2 to create a pulse with a duration of 200 ms
  else if(sw2.isOn){
    led.pulse(200);
  }
  // press sw3 to create a pulse with a duration of 1000 ms or 1 sec
  else if(sw3.isOn){
    led.pulse(1000);
  }
});
```

# API

All pin numbering used on this module are based on the RPI board's pinout diagram *numbers 1~40*.

If you are using a *Raspberry Pi OS*, you can check your board's pinout by entering *pinout* from a terminal.
```console
$ pinout  
```

All numbers in parenthesis are the pin numbers used on this module.

<br>

## GPIO

### state

`input/output property`

Shows the current digital logical state of an input/output object during runtime. It is a getter only property.

Returns *true* if the object logical state is *high* or *ON*.

Returns *false* if the object logical state is *low* or *OFF*.

##### Example 1
```js
const r = require('array-gpio');

let sensor  = r.in(11);

// returns the current state of the sensor
console.log(sensor.state); // false
```

##### Example 2
```js
const r = require('array-gpio');

let sw = r.in(11);
let led = r.out(33);

sw.watch(function(){
  if(sw.state && !led.state){

  console.log(sw.state); // true
  console.log(led.state); // false

  led.on();

  console.log(sw.state); // true
  console.log(led.state); // true
  }
});
```

### isOn and isOff

`input/output property`

Similar with the *state* property, it will return the current digital logical state of an input/output object with explicit context.

**isOn** - returns *true* if the object logical state is *high* or *ON*, otherwise it returns *false*.  

**isOff** - returns *true* if the object logical state is *low* or *OFF*, otherwise it returns *false*.

##### Example
```js
const r = require('array-gpio');

let sw1 = r.in(11);
let sw2 = r.in(13);
let led = r.out(33);

r.watchInput(() => {
  // turns on led if sw1 is on and if led is off
  if(sw1.isOn && led.isOff){
    led.on();
  }
  // turns off led if sw2 is on and if led is on
  else if(sw2.isOn && led.isOn){
    led.off();
  }
});
```

### pin

`input/output property`

Returns the GPIO pin used from any input/output objects.

##### Example
```js
const r = require('array-gpio');

let sw = r.setInput(11);
let led = r.setOutput(33);

console.log(sw.pin);  // 11
console.log(led.pin); // 33
```

### close()

`input/output method`

Closes an input/output object. Removes any events (pin watching) from the object and resets the pin to GPIO input.

##### Example 1
```js
const r = require('array-gpio');

let sw = r.setInput(11);
let led = r.setOutput(33);

sw.close();
led.close();
```
##### Example 2
```js
const r = require('array-gpio');

let input = r.setInput({pin:[11, 13]});
let output = r.setOutput({pin:[33, 35]});

function appExitProcess(){
  console.log('closing all I/O objects');
  for(let x in input){
    input[x].close();
  }
  for(let x in output){
    output[x].close();
  }
}

// using Ctrl-C for app exit
process.on('SIGINT', function (){
  appExitProcess();
  process.exit(0);
});
```

### read([callback])

`input/output method`

The conventional way of getting the current logical state condition of an input/output object.

Returns logical **1** value if the object state is in *high* or *ON* state condition and **0** for *low* or *OFF* state condition.

The optional **callback** parameter will be invoked asynchronously after returning the object state condition.

This method is similar to **state** property but as a method property, you can use a
callback argument to execute any additional application logic based on the object state condition.

##### Example
```js
const r = require('array-gpio');

let sw = r.setInput(11);
let solenoid = r.setOutput(35);

sw.read((state) => {
  if(state === 1)
    solenoid.on();
  else
    solenoid.off();  
});
```

## Input Properties

### in(arg)

or

### setInput(arg)


Sets a GPIO pin or group of GPIO pins as input object.

**arg**

Any valid GPIO pin number or an input option argument.

#### Single Object
```js
const r = require('array-gpio');

let input = r.setInput(11);

// or

let input = r.in(11);
```

#### Array Object
```js
const r = require('array-gpio');

let inputOption = {pin: [11, 13, 15]};

const input = r.setInput(inputOption);

// or

const input = r.in(inputOption);

// By default, the array object created is indexed using zero-based indexing
// (indexed from 0 to n-1, where n is the array.length).

/* Get the current logical state of each input element */
console.log(input[0].state);
console.log(input[1].state);
console.log(input[2].state);
```

To use the pin as index, add an *index* property to the object argument and set the value to `'pin'`.

```js

let  inputOption = {pin:[11, 13, 15], index: 'pin'};

const input = r.setInput(inputOption);

/* Get the current logical state of each input element using pin as index */
console.log(input[11].state);
console.log(input[13].state);
console.log(input[15].state);


/* Iterate over the array object in both cases to access each input element */
for(let x in input){
   console.log(input[x].isOn);
}

// or

input.forEach(function(inputObject){
   console.log(inputObject.isOn);
});

```

### watch (edge, callback, [s])

`input method`

Watches the logical state of an input object for changes or state transitions.

**edge**

`1` - watch state changes from *low* to *high*  (*false* to *true*) or rising edge transition

`0` - watch state changes from *high* to *low*  (*true* to *false*) or falling edge transition

`'both'` - watches both state transitions

If edge argument is not provided, it will watch both transitions same as `'both'`.

**callback**

The callback argument will be called asynchronously everytime a state transition is detected based on the above conditions.

You can passed an optional parameters *state* and *pin* respectively to the callback argument for any fine-grained application logic execution.

**s**

This is an an optional scan rate argument in ms (milliseconds). If not provided, scan rate will default to *100* ms, minimum is *1* ms.

A lower value will make your input more responsive but contact bounce will increase. A higher value will make it less responsive but with a lower contact bounce.

##### Example1
```js
const r = require('array-gpio');

let sw = r.in(11);

function pinEvent(){
  console.log('pinEvent invoked');
}

// pinEvent will be invoked if sw state changes from false to true
sw.watch(1, pinEvent);

// pinEvent will be invoked if sw state changes from true to false
sw.watch(0, pinEvent);

// edge argument is not provided,
// pinEvent will be invoked if sw state changes from true to false and vice versa
sw.watch(pinEvent);

// using a scan rate of 10 ms
sw.watch(pinEvent, 10);
```

##### Example 2
```js
const r = require('array-gpio');

let sw1 = r.in(11);
let led = r.out(33);

// pressing the sw1 button will turn on the led then turns off after 1000 ms delay
// releasing the sw1 button will do nothing
sw1.watch(1, (state) => {

  if(state){
    led.on();
    led.off(1000);
  }

});
```

### unwatch()

`input method`

Stops monitoring an input object from the .watch() method.

### setR(value)

`input method`

Sets the internal resistor of an input pin using either *pull up* or *pull down* resistor.

**value**  

`'pu'` or `1` - Enable internal *pull up* resistor.

`'pd'` or `0` - Enable internal *pull down* resistor.

If argument is not provided, no internal resistor will be used.

##### Example
```js
const r = require('array-gpio');

let sw = r.setInput({pin:[11,13,15]});

// using pull up resistor
sw[0].setR('pu');
// using pull down resistor
sw[1].setR(0);
// no internal resistor is used
sw[2].setR();
```

### watchInput(callback, [s])

`main module method`

Monitor multiple input objects all at once from the main module using **.watchInput()** method.

It will watch both state transistions from *low* to *high* and vice versa for all inputs.

The **callback** argument is shared by all input objects. It will be invoked asynchronously if any of the input objects changes state.

You can passed an optional parameters - *state* and *pin* respectively to the callback argument for any fine-grained application logic execution.

**s** is an optional scan rate argument in ms (milliseconds). If not provided, scan rate will default to *100* ms, minimum is *1* ms. A lower value will make your input more responsive but contact bounce will increase. A higher value will make it less responsive but with a lower contact bounce.

To capture which input object state has changed, you can use each object's **state** or **isOn** property. Or use the *pin* argument from the callback when it is invoked for any state transitions.   

##### Example 1
```js
const r = require('array-gpio');

let sw = r.in({pin:[11, 13, 15], index:'pin'});
let led = r.out({pin:[33, 35], index:'pin'});

r.watchInput(() => {
  // if sw[11] is on, led[33] will turn on
  if(sw[11].isOn){
    led[33].on();
  }
  // if sw[13] is on, led[35] will turn on
  else if(sw[13].isOn){
    led[35].on();
  }
  // if sw[15] is on, both led[33] and led[35] will turn off
  else if(sw[15].isOn){
    led[33].off();
    led[35].off();
  }
});
```
##### Example 2
```js
const r = require('array-gpio');

let sw1 = r.in(11);
let sw2 = r.in(13);
let led = r.out(35);

r.watchInput((state, pin) => {
  if(state && sw1.pin === pin){
    led.on();
  }
  else if(state && sw2.pin === pin){
    led.off();
  }
});
```
### unwatchInput()

`main module method`

Stop monitoring all the input objects from **.watchInput()** method.
It will stop invoking the shared callback argument for any input state changes.

##### Example
```js
const r = require('array-gpio');

let sw1 = r.in(11);
let sw2 = r.in(13);
let sw3 = r.in(15);

let led1 = r.out(33);
let led2 = r.out(35);

r.watchInput(() => {
  if(sw1.state){
    return led1.on();
  }
  if(sw2.state){
    return led2.on();
  }
  if(sw3.state){
    led1.off();
    led2.off();
  }
});

// stops all input pin monitoring after 15 secs
setTimeout(() => r.unwatchInput(), 15000);
```

### Output Properties

### setOutput(arg)

or

### out(arg)

`main module method`

Sets a GPIO pin or group of GPIO pins as output object.

**arg**

Any valid GPIO pin number or an output option argument.


#### Single Object
```js
const r = require('array-gpio');

/* creates a single output object */
let led = r.setOutput(33);

// or

let led = r.out(33);

/* turn on the led */
led.on();
```

#### Array Object

```js
const r = require('array-gpio');

/* creates an array output object */
let outputOption = {pin:[33, 35, 36]};

const output = r.setOutput(outputOption);

// or

const output = r.out(outputOption);

// Similar with input, the array object created is indexed using zero-based indexing
// (indexed from 0 to n-1, where n is the array.length).

/* Get the current logical state of each output element */
console.log(output[0].state);
console.log(output[1].state);
console.log(output[2].state);
```

To use the pin as index, add an *index* property to the object argument and set the value to `'pin'`.
```js
let outputOption = {pin:[33, 35, 36], index:'pin'};

const output = r.setOutput(outputOption);

/* Get the current logical state of each output element using pin as index */
console.log(output[33].state);
console.log(output[35].state);
console.log(output[36].state);

// iterate over the array object in both cases to access each output element
for(let x in output){
   output[x].on();
}

// or

output.forEach(function(outputObject){
   outputObject.on();
});
```

### on([t],[callback]) and off([t],[callback])

`output method`

Sets the state of an output object to logical *high* state condition (*true*) or *low* state condition (*false*).

**t** is an optional time delay in milliseconds.

The state will change after the duration of time delay *t*.

**callback**

The optional callback argument will be invoked asynchronously after the output state has changed.

You can passed an optional parameter *state* for any fine-grained application logic execution.

##### Example
```js
const r = require('array-gpio');

let sw1 = r.in(11);
let sw2 = r.in(13);
let actuator1 = r.out(33);
let actuator2 = r.out(35);

r.watchInput(() => {
  if(sw1.isOn && actuator1.isOff){
    actuator1.on(200); // turns on after 200 ms delay
    actuator2.on((state) => {
      if(state){
        console.log('actuator2 is on');
      }
    });
  }
  else if(sw2.isOn && actuator2.isOn){
    actuator1.off(50); // turns off after 50 ms delay
    actuator2.off((state) => {
      if(!state){
        console.log('actuator2 is off');
      }
    });
  }
});
```

### write(bit [,callback])

`output method`

This is the conventional way of setting the ouput state to *high* or *low* state condition.

**bit** - control bit value.

`1` or `true` - high or ON state

`0` or `false` - low or OFF state

**callback**

The optional callback argument will be invoked asynchronously after the output state has changed.

You can passed an optional parameter *state* for any fine-grained application logic execution.

##### Example
```js
const {setInput, setOutput, watchInput} = require('array-gpio');

const sw = setInput(11,13);
const motor = setOutput(33,35);

let sw1 = sw[0];
let sw2 = sw[1];

let motorA = motor[0];
let motorB = motor[1];

watchInput((state) => {
  if(sw1.read()){
    motorA.write(state, () => motorB.write(!state));
  }
  if(sw2.read()){
    motorB.write(state, () => motorA.write(!state));
  }
});
```

### pulse(pw [,callback])

`output method`

Generates a single square wave pulse with a duration of *pw*.

**pw**

This is the pulse width in milliseconds or the time duration of the pulse.

**callback**

The optional callback argument will be invoked asynchronously when *pw* time duration expires.

##### Example
```js
const r = require('array-gpio');

let sw1 = r.in(11);
let sw2 = r.in(13);
let actuator = r.out({pin:[33, 35]});

r.watchInput(() => {
  // starts a single pulse w/ a duration of 1 sec
  if(sw1.isOn && actuator[0].isOff){

    actuator[0].pulse(1000);

  }
  // starts a single pulse w/ a duration of 2 secs
  else if(sw2.isOn && actuator[1].isOff){

    console.log('start of actuator[1] pulse');
    actuator[1].pulse(3000, () => {
      console.log('end of actuator[1] pulse');
    });

  }
});

```

***

## PWM

### startPWM(pin)

Creates a pwm object from the provided GPIO pin and starts the PWM operations.

Sets GPIO pins *12* and *33* to alternate function 0 (ALT0) and sets pins *12* and *35* to alternate function 5 (ALT5).

This operation requires root access.

**pin**

Channel 1 - pins *12* and *32*.

Channel 2 - pins *33* and *35*.

You can only control 2 peripherals independently, one from channel 1 and one from channel 2. If both peripherals are from the same channel, you can control both channels using only
the control values (setRange and setData) from one of the peripherals.

### setClockFreq(div)

**div**

The divisor value to calculate the desired clock frequency from a fixed oscillator freq of 19.2 MHz.

(0 to 4095)

freq = 19200000/div

### setRange(range)

Sets the period **T** of the pwm pulse.

**range** The period T of the pulse

### setData(data)

Sets the **pw** (pulse width) of the pwm pulse.

**data** The pulse width of the pulse

### stop()

Stops temporarily the pulse generation from the system 19.2 MHz clock oscillator.

You can restart the pulse generation at anytime by calling the **.pulse()** or **.setData()** method.

### close()

Stops PWM operations on the GPIO pin. Resets the pin to GPIO input.

##### Example 1
![](https://raw.githubusercontent.com/EdoLabs/src3/master/pwm-example1.svg?sanitize=true)

```js
/* Connect an led to pin 12. */

/* r for raspberry pi */
const r = require('array-gpio');

/* create a pwm object using pin 12 */
var pwm = r.startPWM(12);

/* set the pwm clock frequency using a div value of 1920 */
pwm.setClockFreq(1920); // sets clock freq to 10kHz or 0.1 ms time resolution for T and pw

/* set period (T) of the pulse */
pwm.setRange(1000); // 1000 x 0.1 ms = 100 ms (actual period T)

/*
 * set pw (pulse width) of the pulse and start the pulse generation for 2 seconds
 *
 * The led attached to pin 12 should blink for 2 seconds
 */
pwm.setData(100); // 100 x 0.1 ms = 10 ms (actual pw)

/* stop the pwm operation and reset pin 12 to GPIO input after 2 secs */
setTimeout(function(){

  pwm.stop();
  pwm.close();

}, 2000);


```

### startPWM(pin, freq, T, pw)

Creates a pwm object from a predefined clock frequencies of `10`, `100`, or `1000` kHz that will provide different time resolutions
for the **T** (period) and **pw** (pulse width) of your desired pwm pulse.

**pin**

Choose from channel 1 (12, 32) or channel 2 (33, 35).

**freq** (kHz)

Choose a predefined clock oscillator frequency of `10`, `100`, or `1000` kHz

`10`   kHz provides *0.1* ms resolution

`100`  kHz provides *0.01* ms resolution

`1000` kHz provides *0.001* ms or *1* uS (microsecond) resolution

**T** (ms)

The initial cycle period of the pulse.

**pw** (ms)

The initial pulse width of the pulse.

The ratio of **pw** over **T** is the pulse **duty cycle** (pw/T) x 100%.

### pulse([pw])

Start the pulse generation or generates a new pulse using the **pw** argument provided.
If **pw** argument is not provided, it will use the initial *pw* argument used in **.setPWM()** constructor and start the pulse generation.

**pw** (ms) is the pulse width that will be used to generate a new pulse.

You can change the period *T* of the pulse using the **.setRange()** and the pulse width *pw* using **.setData()** or **.pulse()** method at anytime in your application.

However in servo motor applications, the period *T* is usually fixed while changes in pulse width *pw* controls the rotational position of your servo motors.

##### Example 2
![](https://raw.githubusercontent.com/EdoLabs/src3/master/pwm-example2.svg?sanitize=true)

```js
/* Using a generic micro servo motor (~4.8 to 6.0 V)
 *
 * T = 20 ms (pulse period)
 *
 * pw (pulse width) needed for various servo positions
 *
 * pw 1.0 ms - pos 1, home position
 * pw 1.5 ms - pos 2, rotates 40 degrees cw (clockwise) from pos 1
 * pw 2.0 ms - pos 3, rotates 80 degress cw from pos 1
 * pw 2.5 ms - pos 4, rotates 120 degress cw from pos 1
 *
 */

const r = require('array-gpio');

var pin  = 33;    /* pin from channel 2 */
var freq = 10;    /* using 10 kHz clock frequency that will provide a 0.1 ms time resolution */
var T    = 200;   /* Use 200 to get the 20 ms period (200 x 0.1 ms = 20 ms) */
var pw   = 10;    /* Use 10 to get an initial pulse width of 1.0 ms (10 x 0.1 ms = 1.0 ms), home position */

/* initialize PWM using with above pin, freq, T and pw details */
var pwm = r.startPWM(pin, freq, T, pw);

/* create four push buttons sw[0], sw[1], sw[2] and sw[4] */
const sw = r.setInput({pin:[11, 13, 15, 19]});

r.watchInput(() => {
  /* Press sw[0] button to rotate the servo motor to pos 1 or home position */
  if(sw[0].isOn){
    pwm.pulse(10);    // 1.0 ms pw
  }
  /* Press sw[1] button to rotate to pos 2 */
  else if(sw[1].isOn){
    pwm.pulse(15);    // 1.5 ms pw
  }
  /* Press sw[2] button to rotate to pos 3 */
  else if(sw[2].isOn){
    pwm.pulse(20);    // 2.0 ms pw
  }
  /* Press sw[3] button to rotate to pos 4 */
  else if(sw[3].isOn){
    pwm.pulse(25);    // 2.5 ms pw
  }
});

const appExitProcess = () => {
  console.log('closing all sw and pwm objects');
  for(let x in sw){
    sw[x].close();
  }
  pwm.close();
  process.exit(0);
}

process.on('SIGINT', () => {
  console.log('\napp terminated using Ctrl-C');
  appExitProcess();
});

```

***
## I2C

### startI2C()

Sets i2c pins 03 (SDA) and 05 (SCL) to its alternate function (ALT0) for i2c operation.

Returns an i2c object with properties to configure the I2C interface to start the i2c data transfer operation.

This operation requires root access.

### begin()

Starts i2c operation in your application.
This operation is integrated in setI2C() method, so there is no need to call it explicitly to start the i2c operation.

### end()

Stops i2c operation and resets i2c pins 03 (SDA) and 05 (SCL) to GPIO input pins.

### setClockFreq(div)

Sets the i2c clock speed based on the **div** divisor value. Check the various *div* values below and the possible clock speeds that will be generated.
```code
div 2500 => 10us => 100 kHz
div 626  => 2.504us => 399.3610 kHz
div 150  => 60ns => 1.666 MHz (default at reset)
div 148  => 59ns => 1.689 MHz
```

### setTransferSpeed(baud)

Directly set the the i2c clock speed using a baud argument instead of using a div value. Either use the setClockFreq above or this method. 

Sets the i2c clock frequency by converting the **baud** argument to the equivalent i2c clock divider value.

### selectSlave(addr)

Sets the i2c address of the slave device.

**addr**

The i2c address of the slave device.

### write(wbuf, n)

Write a number of bytes to the currently selected i2c slave device.

**wbuf** The buffer containing the actual data bytes to send/write to the selected i2c slave device.

**n**	The number of bytes to send/write to the selected i2c slave device.

### read(rbuf, n)

Read a number of bytes from the currently selected i2c slave device.

**rbuf** The buffer containing the actual data bytes to read/receive from the selected i2c slave device.

**n**	The number of bytes to read/receive from the selected i2c slave device.

##### Example
![](https://raw.githubusercontent.com/EdoLabs/src3/master/i2c-example.svg?sanitize=true)

```js
/* Using MCP9808 Temperature Sensor
 *   
 * Please read the MCP9808 datasheet on how to configure the chip for more details.
 */

const r = require('array-gpio');

let i2c = r.startI2C(); // using SDA1 and SCL1 (pin 3 & 5) pins

/* Set data transfer speed to 200 kHz */
i2c.setTransferSpeed(200000);

/* MCP9808 hardware device address */
let addr = 0x18;

/* Select the MCP9808 device for data trasfer */
i2c.selectSlave(addr);

/* Setup the application read and write data buffer */
const wbuf = Buffer.alloc(16); // write buffer
const rbuf = Buffer.alloc(16); // read buffer

/* Accessing the internal 16-bit manufacturer ID register within MCP9808 */
wbuf[0] = 0x06; // from the MCP9808 datasheet, set the address of the manufacturer ID register to the write buffer
i2c.write(wbuf, 1); // writes 1 data byte to the slave device selecting the MCP9808 manufacturer ID register for data access

/* Master (rpi) device will now read the content of the 16-bit manufacturer ID register (should be 0x54 as per datasheet) */
/* Reading 2 data bytes - the upper byte (rbuf[0]) and lower byte (rbuf[1]) from the manufacturer ID register, ID value is on the lower byte from the datasheet */
i2c.read(rbuf, 2);

console.log('MCP9808 ID: ', rbuf[1].toString(16));  // convert the ID value to hex value

/* Based on MCP9808 datasheet, compute the temperature data as follows */
function getTemp(){

  let Temp = null;
  let UpperByte = rbuf[0]; // MSB
  let LowerByte = rbuf[1]; // LSB

  UpperByte = UpperByte & 0x1F; // Clear flag bits

  /* Temp < 0 C */
  if ((UpperByte & 0x10) == 0x10){
	UpperByte = UpperByte & 0x0F; // Clear SIGN
	Temp = 256 - ((UpperByte * 16) + (LowerByte / 16));

  /* Temp > 0 C */
  }
  else {
	Temp = ((UpperByte * 16) + (LowerByte / 16));
  }

  /* Print out temperature data */
  console.log('Temp: ', Temp);

  return Temp; 

}

/* Get temperature readings every 2 seconds */
setInterval( function(){
  /* Accessing the internal 16-bit configuration register within MCP9808.
     You can skip accessing this register using default settings */
  wbuf[0] = 0x01; // address of the configuration register
  /* Change content of configuration register */
  wbuf[1] = 0x02; // register upper byte, THYST set with +1.5 C
  wbuf[2] = 0x00; // register lower byte (power up defaults)
  i2c.write(wbuf, 3);

  /* Accessing the internal 16-bit ambient temp register within MCP9808 */
  wbuf[0] = 0x05; // address of ambient temperature register
  i2c.write(wbuf, 1);

  /* Read the content of ambient temp register */
  i2c.read(rbuf, 2); // read the UpperByte and LowerByte data

  /* Get temperature data and print out the results */
  getTemp();

}, 2000);

process.on('SIGINT', function (){
  console.log('\napp terminated using Ctrl-C');
  i2c.end();
  process.exit(0);
});

```

***
## SPI

### startSPI()

Sets SPI0 bus pins 19 (MOSI), 21 (MISO), 23 (CLK), 24 (CE0) and 26 (CE1) to its alternate function (ALT0) for spi operation.

Returns an spi object with properties to configure the SPI interface.

This operation requires root access.

### begin()

Initializes the SPI0 bus pins for spi operation.
This process is integrated in setSPI() method, so there is no need to call it explicitly to start the spi operation.

### setClockFreq(div)

Sets the SPI clock frequency using a divisor value.

Clock is based on the nominal core clock rate of 250MHz on RPi1 and RPi2, and 400MHz on RPi3.

**div**

The SPI divisor to generate the SPI clock frequency.

The information below shows the various *div* value and the *clock frequency* in kHz that will be generated.

```code
SPI div  2048  = 122.0703125kHz on Rpi2, 195.3125kHz on RPI3
SPI div  1024  = 244.140625kHz on Rpi2, 390.625kHz on RPI3
SPI div  512   = 488.28125kHz on Rpi2, 781.25kHz on RPI3
SPI div  256   = 976.5625kHz on Rpi2, 1.5625MHz on RPI3
SPI div  128   = 1.953125MHz on Rpi2, 3.125MHz on RPI3 (default)
SPI div  64    = 3.90625MHz on Rpi2, 6.250MHz on RPI3
SPI div  32    = 7.8125MHz on Rpi2, 12.5MHz on RPI3
SPI div  16    = 15.625MHz on Rpi2, 25MHz on RPI3
SPI div  8     = 31.25MHz on Rpi2, 50MHz on RPI3
```

### chipSelect(cs)

Sets the chip select pin(s).

When data transfer starts, the selected pin(s) will be asserted or held in active state (usually active **low**) during data transfer.

**cs**

Choose from one of cs values below.
```code
cs = 0,  Chip Select 0
cs = 1,  Chip Select 1
cs = 2,  Chip Select 2
cs = 3,  No Chip Select
```

### setCSPolarity(cs, active)

Change the active state of the chip select pin.

**cs**

The chip select pin you want to change the active state.

**active**

Select `0` for active low or `1` for active high state.

### setDataMode(mode)

Sets the SPI data mode, the clock polariy (CPOL) and phase (CPHA).

**mode**

Choose from one of SPI mode below.
```code
mode = 0,  CPOL = 0, CPHA = 0
mode = 1,  CPOL = 0, CPHA = 1
mode = 2,  CPOL = 1, CPHA = 0
mode = 3,  CPOL = 1, CPHA = 1
```

### transfer(wbuf, rbuf, n)

Transfers any number of bytes to and from the currently selected spi slave device.
This method makes it possible to perform simultaneous write and read operations for date transfer.

Selected CS pins (as previously set by chipSelect) will be held in active state during the data transfer.

**wbuf** The buffer containing the actual data bytes to send/write to the selected spi slave device.

**rbuf** The buffer containing the actual data bytes to read/receive from the selected spi slave device.

**n**	The number of bytes to send/receive from/to the selected spi device.


### write(wbuf, n)

Write a number of bytes to the currently selected spi slave chip.

Asserts the currently selected CS pins (as previously set by chipSelect) during the data transfer operations.

**wbuf** The buffer containing the actual data bytes to write/send to the selected spi slave device.

**n**	 The number of bytes to write/send to the selected spi slave device.


### read(rbuf, n)

Read a number of bytes from the currently selected spi slave device.

**rbuf** The buffer containing the actual data bytes to read/receive from the selected spi slave device.

**n**	 The number of bytes to read/receive from the spi slave device.

### end()

Stops the SPI data transfer operations. SPI0 pins 19 (MOSI), 21 (MISO), 23 (CLK), 24 (CE0) and 26 (CE1) are reset to GPIO input pins.

##### Example
![](https://raw.githubusercontent.com/EdoLabs/src3/master/spi-example.svg?sanitize=true)

```js
/* Using MCP3008 10-bit A/D Converter Chip
 *
 * In this example, we will connect the Vdd and Vref pins to the Raspberry Pi's 3.3 V.
 * Channel 0 (pin 1) will be used for analog input voltage using single-ended mode.
 *
 * Please read the MCP3008 datasheet on how to configure the chip for more details.
 */

const r = require('array-gpio');

var spi = r.startSPI();

spi.setDataMode(0);
spi.setClockFreq(128);
spi.setCSPolarity(0, 0);
spi.chipSelect(0);

/* Setup write and read data buffer */
const wbuf = Buffer.alloc(16); // write buffer
const rbuf = Buffer.alloc(16); // read buffer

/* Configure the chip to use CH0 in single-ended mode. 
 * The device will begin to sample the analog input on the fourth rising edge of the clock after
 * the start bit has been received */
wbuf[0] = 0x01; // start bit  
wbuf[1] = 0x80; // using channel 0, single ended
wbuf[2] = 0x00; // don't care data byte as per datasheet
spi.write(wbuf, 3); 

/* Alternative way to write and read to a slave at the same time */
//spi.transfer(wbuf, rbuf, 3); // write 3 bytes and receive 3 bytes afterwards

/* Read the conversion result */ 
spi.read(rbuf, 3); 

/* Read A/D conversion result 
 * The 1st byte received through rbuf[0] will be discarded as per datasheet */
var data1 = rbuf[1] << 8;  	// MSB, using only 2 bits data
var data2 = rbuf[2];	   	// LSB, 8 bits data
var adc = data1 + data2; 	// combine both data to create a 10-bit digital output code

console.log("* A/D digital output code: ", adc);

/* Compute the output voltage */
var vout = (adc/1023) * 3.3;

console.log("* A/D voltage output: ", vout);

spi.end();
```
