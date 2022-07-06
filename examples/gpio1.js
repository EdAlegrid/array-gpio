// Connect a momentary switch button to pin 11 and an led to pin 33.

const r = require('array-gpio');

let sw = r.in(11); 
let led = r.out(33);
 
/* Pressing the sw button will turn on the led,
 * releasing the sw button will turn off the led.
 */
sw.watch((state) => {
  	if(state){
  		led.on();
  	}
	else{
		led.off();
  	}
}); 
