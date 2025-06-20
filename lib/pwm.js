/*!
 * array-gpio/pwm.js
 *
 * Copyright(c) 2017 Ed Alegrid
 * MIT Licensed
 */

'use strict';

const rpi = require('./rpi.js');

var pwm_instance = 0;
var pwmPin = {c1:[], c2:[]};
var freqF = 1, validT = 0, validPW = 0, validPin = 0, validFreqF = 0;

class PWM {

#T = 0; 
#pw = 0;
#pin = 0;
#pwmStarted = false;
#pinOnlySetup = false;

#validate_pwm_params(pin, freq, T, pw){
    ++pwm_instance;

	if(pin === 33 || pin === 35 || pin === 12 || pin === 32){
		validPin = pin;
		
		if(validPin === 12 || validPin === 32){
			pwmPin.c1.push(validPin);
		}
		else{
			pwmPin.c2.push(validPin);
		}

  		// check duplicate pins
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
		throw new Error('invalid pwm pin');
	}

	// Get frequecy factor (freq) 
	if(freq === undefined){
	 	validFreqF = 1;
	}
    else if(freq === 10 || freq === 100 || freq === 1000 ){
	 	validFreqF = freq;
	}
	else{
	 	throw new Error('invalid pwm freq');
	}

	// T or range 
	if(T === undefined){
	 	validT = 0;
	}
	else if(T > 0 || T < 1000000 ){
	 	validT = T;
	}
	else{
	 	throw new Error('invalid pwm period T');
	}
	
	// pw or data 
	if(pw === undefined){
	 	validPW = 0;
	}
    else if(pw > 0 || pw < 1000000 ){
	 	validPW = pw;
	}
	else{
		throw new Error('invalid pwm data');
	}

    this.#T = validT;
	this.#pw = validPW;
	this.#pin = validPin;
	

	if(freq === 1){
		this.#pinOnlySetup = true;
	}

	/* Initilize PWM. Servo control will use only mark/space (M/S) mode. */
	this.pwm_init();
	this.enable(false);
	this.#pwmStarted = false;
  
	let div = null, res = null;

    // e.g. var pwm = r.startPWM(pin, freq, T, pw);
    if(validFreqF > 1 && validT > 0 && validPW > 0){

		// 10kHz -> 0.1 ms
		if(freq === 10){
			freqF = 10; 
			div = 1920 
			this.setClockFreq(div);
		}
		// 100KHz -> 0.01 ms
		else if(freq === 100){
			freqF = 100; 
			div = 192
			this.setClockFreq(div);
		}
		// 100KHz -> 0.001 ms
		else if(freq === 1000){
			freqF = 1000; 
			div = 19 
			this.setClockFreq(div);
		}

		let freqC = (Math.round(19200000/div))/1000;
	 
		if(freqF === 10){
		 	res = '0.1 ms';
		}
		else if(freqF === 100){
		 	res = '0.01 ms';
		}
		else if(freqF === 1000){
		 	res = '0.001 ms';
		}

	 	/* freqF is freq factor and not validFreqF, pwm is using one freq for all pins */
	 	console.log('PWM config: pin ' + validPin + ', freq ' + freqC + ' KHz (' + res + '), T ' + validT + ', pw ' + validPW); 

		this.setRange(this.#T);
		this.setData(this.#pw);
	}
    else if(validFreqF === 1){  // e.g var pwm = r.startPWM(12);
	 	console.log('PWM config: (pin ' + validPin + ')'); 
        this.#pinOnlySetup = true;
        // Note: setClockFreq(), setRange() and setData() must be set manually 
    }
		 
	/* Check for more than 1 peripheral used and channel pairs */
    if(pwm_instance > 1){
		console.log("\nArray-gpio has detected you are using more than 1 PWM peripheral."
        + "\nClock frequency is set to " + freqF + " KHz for all.\n");
	}

	/* channel 1 */
	if(pwmPin.c1.length > 1 && pwm_instance > 1){
		if(pwmPin.c1[1] === validPin){
			console.log("Paired PWM peripherals (pin " + pwmPin.c1 + ") detected.");
			console.log("Range and data will be same for both peripherals.\n");
		}
	}
	/* channel 2 */
	if(pwmPin.c2.length > 1 && pwm_instance > 1){
		if(pwmPin.c2[1] === validPin){
			console.log("Paired PWM peripherals (pin " + pwmPin.c2 + ") detected.");
			console.log("Range and data will be same for both peripherals.\n");
		}    
	}	
}

constructor(pin, freq, T, pw){
	this.#validate_pwm_params(pin, freq, T, pw);
}

pwm_init(){
	rpi.pwm_init();
}

/* initialize PWM object */
enable (start){
	rpi.pwm_setup(this.#pin, start);
}

/* set oscillator clock frequency using a divider value */
setClockFreq (div){
  	if(div > 0 && div < 4095 ){
		rpi.pwm_set_clock_divider(div);

		let freqC = (Math.round(19200000/div))/1000; // calculated freq 

		if(pwm_instance === 1){
    		console.log('Frequency calculated using (div ' + div +'): ' + freqC + ' KHz');
		}
  	}
  	else{
    	throw new Error('setClockFreq error: invalid div value ' + div);
  	}
}

/* set period T or space value from m/s mode */
setRange (range){
    this.#T = range;
  	rpi.pwm_set_range(this.#pin, range);
}

/* set pw(pulse width) over period T or mark value over space */ 
setData (data){
	this.#pw = data;
	this.enable(true);
	/* validate pw vs range */
	if(freqF === 1 || freqF === 10 || freqF === 100 || freqF === 1000){
		if(this.#T === 0 ){
		  	console.log('WARNING! pwm pin', this.#pin, 'period T or range is', 0);
            console.log('Please set a range first using the setRange(range) method');
		}
		else if(data > 0 && data <= this.#T){
		    rpi.pwm_set_data(this.#pin, data);
		}
		else if(data > this.#T){
		  	console.log('WARNING! pwm pin', this.#pin, ' pw ' + data + ' is higher than the period T', this.#T );
		  	rpi.pwm_set_data(this.#pin, data);
		}
	} 
}

start (){
  	if(this.#pw === 1){
    	this.#pw = this.#T; 
  	}
  	rpi.pwm_set_data(this.#pin, this.#pw);
}

stop (){
  	this.enable(false);
  	this.#pwmStarted = false;
}

pulse (pw){
	if(!this.#pwmStarted){
		this.enable(true);
	}

	this.#pwmStarted = true;

	if(pw === undefined){
		this.setData(this.#pw);
	}
	else {
		rpi.pwm_set_data(this.#pin, pw);
	}
}

stopPulse (){
  	this.enable(false);
  	this.#pwmStarted = false;
}

close (){
  	this.#pwmStarted = false;
  	/* reset to 19.2MHz */	
  	//rpi.pwm_set_clock_divider(1);
  	rpi.pwm_setup(this.#pin, false);
  	rpi.pwm_set_range(this.#pin, 0);
  	rpi.pwm_set_data(this.#pin, 0);
	rpi.pwm_reset();
  	//rpi.pwm_reset_pin(this.#pin);
}

}

module.exports = PWM;

