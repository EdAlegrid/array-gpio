/* Connect an led to one of these pins - 12, 32, 33, 35 (physical pin numbers from the board header) */
 
const r = require('array-gpio');

/* start PWM using pin 12 */
var pwm = r.startPWM(12);
 
/* set clock frequency using a div value of 1920 */
pwm.setClockFreq(1920); // sets clock freq to 10kHz or 0.1 ms time resolution for T and pw 
 
/* set period (T) of the pulse */
pwm.setRange(1000); // 1000 x 0.1 ms = 100 ms (actual period T)
 
/*
 * set pw (pulse width) of the pulse and start the pulse generation for 2 seconds 
 *
 * The led attached to pin 12 should blink for 2 seconds
 */
pwm.setData(100); // 100 x 0.1 ms = 10 ms (actual pw)
 
/* stop PWM and return pin 12 to GPIO input mode */
setTimeout(function(){
        pwm.stop();
        pwm.close();
 }, 2000);
