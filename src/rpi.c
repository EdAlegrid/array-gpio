/*
 * rpi.c
 * Copyright (c) 2017 Ed Alegrid <ealegrid@gmail.com>
 * GNU General Public License v3.0
 *
 */

#define  _DEFAULT_SOURCE	// for nanosleep() and usleep()

#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <errno.h>
#include <string.h>
#include <stdbool.h>
#include <unistd.h>
#include <time.h>

#include "rpi.h"

/* The base addresses of each peripherals found on BCM2835 Arm Peripheral Manual */ 
#define ST_BASE			(peri_base + 0x3000)
#define CLK_BASE      	(peri_base + 0x101000)
#define GPIO_BASE      	(peri_base + 0x200000)
#define PWM_BASE      	(peri_base + 0x20C000)
#define SPI0_BASE		(peri_base + 0x204000)
#define BSC0_BASE 		(peri_base + 0x205000)
#define BSC1_BASE      	(peri_base + 0x804000)

/* Unused base addresses */
#define GPIO_PADS      	(peri_base + 0x100000)
#define AUX_BASE		(peri_base + 0x215000)
#define SPI1_BASE		(peri_base + 0x215080)
#define SPI2_BASE		(peri_base + 0x2150C0)

/* The smallest unit of data for memory management */
/* We will use the variable page_size at run time instead */
#define PAGE_SIZE		(4*1024)	/* See page_size variable declaration below */

/* No. of memory address pointers for mmap() */ 
#define BASE_INDEX 		7  // set to 11 for all base addresses

/* System timer register addresses */
#define CS		(base_pointer[0] + 0x0) 
#define CLO 	(CS + 0x1) 
#define CHI		(CS + 0x2) 
#define CO		(CS + 0x3)

/* Clk register addresses */
#define GPCTL	(base_pointer[1] + 0x28) 
#define GPDIV	(base_pointer[1] + 0x29) 

/*
 * GPIO register addresses
 *
 * Using only register 0 (access to physical pin numbers 1 to 40) 
 * Using the first byte of the 32-bit (4 bytes) register accessing each register as 32-bit word size
 */
#define GPSEL    (base_pointer[2] + 0x0)
#define GPSET  	 (GPSEL + 0x1C/4)	
#define	GPCLR    (GPSEL + 0x28/4)
#define GPLEV  	 (GPSEL + 0x34/4)
#define	GPEDS  	 (GPSEL + 0x40/4) 
#define GPREN  	 (GPSEL + 0x4C/4) 
#define	GPFEN  	 (GPSEL + 0x58/4)
#define GPHEN  	 (GPSEL + 0x64/4)
#define	GPLEN  	 (GPSEL + 0x70/4)
#define	GPAREN 	 (GPSEL + 0x7C/4)
#define	GPAFEN 	 (GPSEL + 0x88/4)
#define GPPUD  	 (GPSEL + 0x94/4)
#define GPPUDCLK (GPSEL + 0x98/4)

/* PWM register addresses */
#define CTL 	(base_pointer[3] + 0x0)			
#define STA 	(CTL + 0x4/4)		
#define RNG1	(CTL + 0x10/4)
#define DAT1	(CTL + 0x14/4)
#define FIF1	(CTL + 0x18/4)
#define RNG2    (CTL + 0x20/4)
#define DAT2	(CTL + 0x24/4)

/* SPI register addresses */
#define SPI_CS 		(base_pointer[4] + 0x0)  
#define SPI_FIFO	(SPI_CS + 0x4/4)
#define SPI_CLK		(SPI_CS + 0x8/4)
#define SPI_DLEN	(SPI_CS + 0xC/4)
#define SPI_LTOH	(SPI_CS + 0x10/4)
#define SPI_DC		(SPI_CS + 0x14/4)

/* I2C register addresses */
//#define C		(base_pointer[5] + 0x0)  
#define C		(base_pointer[6] + 0x0) 
#define S 		(C + 0x4/4)  
#define DLEN	(C + 0x8/4)  
#define A		(C + 0xC/4) 
#define FIFO	(C + 0x10/4) 
#define DIV		(C + 0x14/4) 
#define DEL		(C + 0x18/4) 
#define CLKT	(C + 0x1C/4) 

#define INFO_SIZE 100 

/* The smallest unit of data for memory management, obtaining it at run time */
int page_size = 0; // 4*1024;

/* Peripheral base address variable. The value of which will be determined
 depending on the board type (Pi zero, 3 or 4) at compile time */
volatile uint32_t peri_base = 0;

/* Temporary array container for pointers to peripheral register base address */
volatile uint32_t *base_pointer[BASE_INDEX] = {0};

/* mmap() base address container */
volatile uint32_t base_add[BASE_INDEX] = {0};

/* System clock frequency: RPi 1 & 2 = 250 MHz, RPi 3 & 4 = 400 MHz */
uint32_t system_clock = 250000000;  // 250 MHz

/**********************************

   RPI Initialization Functions

***********************************/

/* Get device RPI model and set peripheral base address accordingly */
void set_base_address(){

	FILE *fp;
	char info[INFO_SIZE];
	
	fp = fopen("/proc/cpuinfo", "r");
	
	if (fp == NULL) {
		fputs ("reading file /proc/cpuinfo error", stderr);
		exit (1);
	}
	
	/* Get 'Model' info */
	while (fgets (info, INFO_SIZE, fp) != NULL){
		if (strncmp (info, "Model", 5) == 0)
        	break ;
    }
	//printf("%s", info);

  	if(strstr(info, "Pi Zero")||strstr(info, "Pi 1")){	// Pi Zero, tested on WiFi version
		//puts("Pi zero/Pi 1");
	    peri_base = 0x20000000;
    }
	else if(strstr(info, "Pi Zero 2")||strstr(info, "Pi 3")){
		//puts("Pi Zero 2/Pi 3");
    	peri_base = 0x3F000000;
        system_clock = 400000000; 
    }
	else if(strstr(info, "Pi Compute Module 3")){
		//puts("Pi Compute Module 3 Model");
    	peri_base = 0x3F000000;
		system_clock = 400000000;
    }
	else if(strstr(info, "Pi 4")||strstr(info, "Pi Compute Module 4")){	// Pi 4 Model B, tested
		//puts("Pi 4 Model B/Pi Compute Module 4");
    	peri_base = 0xFE000000;
        system_clock = 400000000; 
    }
	else if(strstr(info, "Pi 400")){
		//puts("Pi 400 Model");
    	peri_base = 0xFE000000;
        system_clock = 400000000; 
    }
	else{
		//puts("Other Rpi Model");			
		peri_base = 0xFE000000;
        system_clock = 400000000; 
    }
	
	/*
	// Other information
	// Get 'Hardware' info 
    rewind (fp);
    while (fgets (info, INFO_SIZE, fp) != NULL){
    	if (strncmp (info, "Hardware", 8) == 0)
       		break ;
    }
    printf("%s", info); // show Hardware line info

    // Get 'Revision' info 
	rewind (fp);
    while (fgets (info, INFO_SIZE, fp) != NULL){
    	if (strncmp (info, "Revision", 8) == 0)
       		break ;
    }
    printf("%s", info); // show Revision line info
	*/
	  
  	fclose(fp);
}

/*
 * Initialize Arm Peripheral Base Register Adressses using mmap()
 */
void rpi_init(int access) {

	int fd, i;

    set_base_address();

	page_size = (size_t)sysconf(_SC_PAGESIZE);
	//printf("init page_size: %i\n", page_size);

    if(page_size < 0){
		perror("page_size");
		exit(1);
    }

	// access = 0, non-root
	if (!access) { 		
		if ((fd = open("/dev/gpiomem",O_RDWR|O_SYNC)) < 0) {
			perror("opening rpi in /dev/gpiomem");
			printf("%s() error: ", __func__);
			exit(1);
        }
    }
 	// access = 1, root
	else if(access) {
		if ((fd = open("/dev/mem",O_RDWR|O_SYNC)) < 0) {
			perror("opening rpi in /dev/mem requires root access");
			//printf("%s() error: ", __func__);
			puts("Try running your application with sudo or in root!\n");
			exit(1);
        }
    }

	base_add[0] = ST_BASE;
	base_add[1] = CLK_BASE;
	base_add[2] = GPIO_BASE;
	base_add[3] = PWM_BASE;
    base_add[4] = SPI0_BASE;
	base_add[5] = BSC0_BASE;
	base_add[6] = BSC1_BASE;
	
    /* Using mmap, iterate through each base address to get each peripheral base register address */   
    for(i = 0; i < BASE_INDEX; i++){

    	base_pointer[i] = mmap(NULL, page_size, PROT_READ|PROT_WRITE, MAP_SHARED, fd, base_add[i]);

		if (base_pointer[i] == MAP_FAILED) {
            perror("mmap() error");
			printf("%s() error: ", __func__);
			puts("Invalid peripheral register base address.");
            if(close(fd) < 0)
				perror("fd close");
			exit(1);
        }
	
		/* Reset peripheral base register pointers back to 0 */
        *base_pointer[i] = 0; /* disable for socket can operation */  

    	/* Reset peripheral base addresses back to 0 */
        base_add[i] = 0; /* disable for socket can operation */  
	}

    /* Close fd after memory-mapped operation */
	if(close(fd) < 0)
		perror("fd close");
}

/* 
 * Close the library and reset all memory pointers to 0 or NULL
 */
uint8_t rpi_close()
{
  int i;
	page_size = (size_t)sysconf(_SC_PAGESIZE);
	//printf("close page_size: %i\n", page_size);

	for(i = 0; i < BASE_INDEX; i++){
	   	if (munmap( (uint32_t *) base_pointer[i] , page_size) < 0){
       		perror("munmap() error");
			printf("%s() error: ", __func__);
			puts("munmap() operation fail"); 
			return -1;
       	}
        base_pointer[i] = 0; /* disable for socket can operation */  
	}
	
	/* munmap() success */
    return 0;
}

/**************************************

   	Time Delay Functions

***************************************
   1 ms = 1000 us or microsecond
   1 ms = 1000000 ns or nanosecond
   1 ms = 0.001 or 1/1000 sec

   1 sec = 1000 ms
   1 sec = 1000000 us or microsecond
   1 sec = 1000000000 ns or nanosecond
***************************************/

/* Time delay function in nanoseconds */
void nswait(uint64_t ns) { 
    struct timespec req = { ns / 1000000, ns % 1000000 };  
    struct timespec rem;

    while ( nanosleep(&req,&rem) == -1 )
            req.tv_nsec = rem.tv_nsec;
}

/* Time delay function in us or microseconds, valid only if us is below 1000 */
void uswait(uint32_t us) {
    struct timespec req = { us / 1000, us % 1000 * 1000 };
    struct timespec rem;

    while ( nanosleep(&req,&rem) == -1 )
            req.tv_nsec = rem.tv_nsec;
}

/* Time delay function in milliseconds */
void mswait(uint32_t ms) {
    struct timespec req = { ms / 1000, ms % 1000 * 1000000 };
    struct timespec rem;

    while ( nanosleep(&req, &rem) == -1 )
            req.tv_nsec = rem.tv_nsec;
}

/******************************************

    Register Bit Manipulation Functions

*******************************************/

/* Set register bit position to 1 or ON state */  
uint32_t setBit(volatile uint32_t *reg, uint8_t position)
{
    volatile uint32_t result = 0; 
    uint32_t mask = 1 << position;
 	__sync_synchronize();
   	result = *reg |= mask;
    __sync_synchronize();
    return result;
}

/* Set register bit position to 0 or OFF state */  
uint32_t clearBit(volatile uint32_t *reg, uint8_t position)
{
    volatile uint32_t result = 0; 
    uint32_t mask = 1 << position;
 	__sync_synchronize();
   	result = *reg &= ~mask;
    __sync_synchronize();
    return result;
}

/* Check register bit position if it is 0 (OFF state) or 1 (ON state) */  
uint8_t isBitSet(volatile uint32_t *reg, uint8_t position)
{
    uint32_t mask = 1 << position;
 	return *reg & mask ? 1 : 0;
}

/*******************************

    GPIO Control Functions

********************************/

/*
 * Set a GPIO pin based on fsel hex value
 *
 *  fsel hex values  fsel binary values   GPIO pin function 
 *
 *  0x0		     000 		  GPIO Pin is an input
 *  0x1		     001 		  GPIO Pin is an output
 *  0x4		     100          GPIO Pin takes alternate function 0
 *  0x5		     101          GPIO Pin takes alternate function 1
 *  0x6		     110 		  GPIO Pin takes alternate function 2
 *  0x7		     111		  GPIO Pin takes alternate function 3
 *  0x3		     011		  GPIO Pin takes alternate function 4
 *  0x2		     010		  GPIO Pin takes alternate function 5
 *
 */
void set_gpio(uint8_t pin, uint8_t fsel){
      
	/* get base address (GPSEL0 to GPSEL5) using *(GPSEL + (pin/10))
	 * get mask using (alt << ((pin)%10)*3)
	 */
	 
	 volatile uint32_t *gpsel = (uint32_t *)(GPSEL + (pin/10));  // get the GPSEL pointer (GPSEL0 ~ GPSEL5) based on the pin number selected
	 uint32_t mask = ~ (7 <<  (pin % 10)*3); // mask to reset fsel to 0 first
	 *gpsel &= mask;   					     // reset gpsel value to 0
	 mask = (fsel <<  ((pin) % 10)*3);       // mask for new fsel value   
	 __sync_synchronize();
	 *gpsel |= mask; 					     // write new fsel value to gpselect pointer
	 __sync_synchronize();
}

/*
 * Set a GPIO pin as input
 */
void gpio_input(uint8_t pin){
	set_gpio(pin, 0);
} 

/*
 * Set a GPIO pin as output
 */
void gpio_output(uint8_t pin){
  	set_gpio(pin, 1);
}

/*
 * Configure GPIO pin as input or output
 *
 * mode = 0 	input
 * mode = 1 	output
 * mode = 4 	alternate function 0 
 * mode = 5 	alternate function 1
 * mode = 6 	alternate function 2 
 * mode = 7 	alternate function 3
 * mode = 3 	alternate function 4 
 * mode = 2 	alternate function 5
 *
 */
void gpio_config(uint8_t pin, uint8_t mode) {
	if(mode == 0){ 
		set_gpio(pin, 0); 	// input
	}
	else if(mode == 1){
		set_gpio(pin, 1); 	// output
	}
	else if(mode == 4){
		set_gpio(pin, 4); 	// alt-func 0
	}
	else if(mode == 5){ 
    	set_gpio(pin, 5);	// alt-func 1
    }
	else if(mode == 6){
 		set_gpio(pin, 6); 	// alt-func 2
    }
	else if(mode == 7){ 
    	set_gpio(pin, 7); 	// alt-func 3
    }
	else if(mode == 3){
 		set_gpio(pin, 3); 	// alt-func 4
    }
   	else if(mode == 2){ 
    	set_gpio(pin, 2); 	// alt-func 5
	}	
	else{
		printf("%s() error: ", __func__);
  		puts("Invalid mode parameter.");
	}
}

/*
 * Write a bit value to change the state of a GPIO output pin
 *
 * bit = 0 OFF state
 * bit = 1 ON  state
 */
uint8_t gpio_write(uint8_t pin, uint8_t bit) { 

	volatile uint32_t *p = NULL;

	__sync_synchronize();

	if(bit == 1) {
		p = (uint32_t *)GPSET;
		*p = 1 << pin; 
	} 
	else if(bit == 0 ) {
		p = (uint32_t *)GPCLR;
		*p = 1 << pin;
	}
	else{
		printf("%s() error: ", __func__);
		puts("Invalid bit parameter");
	}

	__sync_synchronize();

	return bit; 
}

/*
 * Read the current state of a GPIO pin (input/output)
 *
 * return value
 * 0 (OFF state)
 * 1 (ON  state)
 *
 */
uint8_t gpio_read(uint8_t pin) {
	return isBitSet(GPLEV, pin);
}


/*
 * Remove all configured event detection from a GPIO pin
 */
void gpio_reset_all_events (uint8_t pin) {
	clearBit(GPREN, pin);
	mswait(1);
	clearBit(GPFEN, pin);
	mswait(1);
	clearBit(GPHEN, pin);
	mswait(1);
	clearBit(GPLEN, pin);
	mswait(1);
	clearBit(GPAREN, pin);
	mswait(1);
	clearBit(GPAFEN, pin);
	mswait(1);
	setBit(GPEDS, pin);
	mswait(1);
}

/**************************

   Level Detection Event

***************************/

/* 
 * Enable High Level Event from a GPIO pin 
 *
 * bit = 0 event detection is disabled or OFF
 * bit = 1 event detection is enabled or ON
 */
void gpio_enable_high_event (uint8_t pin, uint8_t bit) {
	if(bit == 1){
  		setBit(GPHEN, pin);
	}
	else if(bit == 0){
  		clearBit(GPHEN, pin);
	}
	else {
		printf("%s() error: ", __func__);
  		puts("Invalid bit parameter.");
	}
}

/* 
 * Enable Low Level Event from a GPIO pin
 *
 * bit = 0 event detection is disabled or OFF
 * bit = 1 event detection is enabled or ON
 */
void gpio_enable_low_event (uint8_t pin, uint8_t bit) {
	if(bit == 1){
  		setBit(GPLEN, pin);
	}
	else if(bit == 0){
  		clearBit(GPLEN, pin);
	}
	else {
		printf("%s() error: ", __func__);
  		puts("Invalid bit parameter.");
	}
}

/**************************

    Edge Detection Event

***************************/

/* Enable Rising Event Detection
 *
 * bit = 0 event detection is disabled or OFF
 * bit = 1 event detection is enabled or ON
 */
void gpio_enable_rising_event (uint8_t pin, uint8_t bit) {
	if(bit == 1){
		setBit(GPREN, pin);
	}
	else if(bit == 0){
		clearBit(GPREN, pin);
	}
	else {
		printf("%s() error: ", __func__);
		puts("Invalid bit parameter.");
	}
}

/* 
 * Enable Falling Event Detection
 *
 * bit = 0 event detection is disabled or OFF
 * bit = 1 event detection is enabled or ON
 */
void gpio_enable_falling_event (uint8_t pin, uint8_t bit) {
	if(bit == 1){
  		setBit(GPFEN, pin);
	}
	else if(bit == 0){
  		clearBit(GPFEN, pin);
	}
	else {
		printf("%s() error: ", __func__);
  		puts("Invalid bit parameter.");
	}
}

/* 
 * Enable Asynchronous Rising Event
 *
 * bit = 0 event detection is disabled or OFF
 * bit = 1 event detection is enabled or ON
 */
void gpio_enable_async_rising_event (uint8_t pin, uint8_t bit) {
	if(bit == 1){
  		setBit(GPAREN, pin);
	}
	else if(bit == 0){
  		clearBit(GPAREN, pin);
	}
	else {
		printf("%s() error: ", __func__);
    	puts("Invalid bit parameter.");
	}
}

/* 
 * Enable Asynchronous Falling Event
 *
 * bit = 0 event detection is disabled or OFF
 * bit = 1 event detection is enabled or ON
 */
void gpio_enable_async_falling_event (uint8_t pin, uint8_t bit) {
	if(bit == 1){
    	setBit(GPAFEN, pin);
	}
	else if(bit == 0){
  		clearBit(GPAFEN, pin);
	}
	else {
		printf("%s() error: ", __func__);
  		puts("Invalid bit parameter.");
	}
}

/*
 * Detect an input event from a GPIO pin
 *
 * The GPIO pin must be configured for a level or edge event detection.
 */
uint8_t gpio_detect_input_event(uint8_t pin) { 
	return isBitSet(GPEDS, pin);
}

/*
 * Reset input pin event when an event is detected
 * (using gpio_detect_input_event() function)
 */  
void gpio_reset_event(uint8_t pin) {
   	setBit(GPEDS, pin);
}

/*
 * Enable internal PULL-UP/PULL-DOWN resistor for input pin
 *
 * value = 0, 0x0 or 00b, Disable Pull-Up/Down, no PU/PD resistor will be used
 * value = 1, 0x1 or 01b, Enable Pull-Down resistor
 * value = 2, 0x2 or 10b, Enable Pull-Up resistor
 */
void gpio_enable_pud(uint8_t pin, uint8_t value) {
	if(value == 0){       
    	*GPPUD = 0x0;	// Disable PUD/Pull-UP/Down
   	}
	else if(value == 1){  
        *GPPUD = 0x1;	// Enable PD/Pull-Down
	}
	else if(value == 2){ 
    	*GPPUD = 0x2;	// Enable PU/Pull-Up
	}
    else{
		printf("%s() error: ", __func__);
		puts("Invalid pud value.");
    }

	uswait(150);  	/* required wait times based on bcm2835 manual */
	setBit(GPPUDCLK, pin);
	uswait(150);	/* required wait times based on bcm2835 manual */
	*GPPUD = 0x0;
	clearBit(GPPUDCLK, pin);
}

/*********************************

	PWM Setup functions

*********************************/

/*
 * Reset all PWM pins to GPIO input
 */
void pwm_reset_all_pins(){
	gpio_input(18); // GPIO 18/PHY pin 12, channel 1
	mswait(1);
	gpio_input(13); // GPIO 13/PHY pin 33, channel 2
	mswait(1);
	gpio_input(12); // GPIO 12/PHY pin 32, channel 1
	mswait(1);
	gpio_input(19); // GPIO 19/PHY pin 35, channel 2
} 

/*
 * Set a GPIO pin to its ALT-Func for PWM
 */
void pwm_set_pin(uint8_t pin){

  	if(pin == 12||pin ==13) {       // alt 100b, PHY pin 33, GPIO 13, alt 0 
    	set_gpio(pin, 4);			// alt 100b, PHY pin 32, GPIO 12, alt 0
  	}
    else if(pin == 18||pin == 19) { // alt 10b, PHY pin 35, GPIO 19, alt 5 	
        set_gpio(pin, 2);			// alt 10b, PHY pin 12, GPIO 18, alt 5
 	}
  	else {
        printf("%s() error: ", __func__);
		puts("Invalid pin number for PWM.");
		puts("Choose only from board header layout pins 12, 32, 33 and 35.");
		exit(1);
  	}
}

/*
 * Reset a PWM pin back to GPIO Input
 */
void pwm_reset_pin(uint8_t pin){

	if(pin == 18||pin ==12||pin==13||pin==19) {     
    	gpio_input(pin);	// GPIO18/PHY12, GPIO12/PHY32, GPIO13/PHY33, GPIO19/PHY35
    }
  	else {
        printf("%s() error: ", __func__);
		puts("Invalid pin.");
  		exit(1);
  	}
}

/*****************************************

	PWM Clock operation functions

******************************************/
/* define clock source constants */
#define OSC	0x1
#define PLLD 	0x6

/*
 * A quick check which clock generator is running
 * (field name: SRC (bit 0 to 3) of CM_GP2CTL register)
 */
uint8_t get_clk_src(){
	/* mask for clk SRC value 4 bits (0 to 3 bit position)*/
	uint32_t mask = 0x0000000F;
	/* return clk SRC value w/ barrier */
	return *GPCTL & mask;  // 0x1 for 19.2 MHz oscillator or 0x6 for PLLD 5000 MHz
}

/*
 * A quick check if clock generator is running
 * (field name: BUSY (bit 7) of CM_GP2CTL register)
 */
uint8_t clk_status(){

	if(isBitSet(GPCTL, 7)){
    	return 1; // clk is running
    }
	else{
    	return 0; // clk is not running
    }
}

/*
 * Calculate clock freq based on divisor div value
 */
void set_clock_div(uint32_t div){

	/* disable PWM while performing clk operations */
	clearBit(CTL, 0);
	clearBit(CTL, 8);

	uswait(10);

	/* check clk SRC and disable it temporarily */
	if(get_clk_src() == OSC){
		*GPCTL = 0x5A000001;  // stop the 19.2 MHz oscillator clock
	}
	else if(get_clk_src() == PLLD) {
		*GPCTL = 0x5A000006;  // stop the PLLD clock
	}
	uswait(20);

	/* forced reset if clk is still running */
	if(isBitSet(GPCTL, 7)){
		*GPCTL = 0x5A000020;  // KILL the clock
		uswait(100);
	}

	/* set divisor from clock manager div register while clk is not running */
	if(!isBitSet(GPCTL, 7)){
		*GPDIV = 0x5A000000 | ( div << 12 );
	} 
	uswait(20); 
}


/*
 * Set clock frequency using a divisor value
 */
uint8_t pwm_set_clock_freq(uint32_t divider) {

	if( 0 < divider && divider < 4096){
		set_clock_div(divider);
	}
	else {
		printf("%s() error: ", __func__);
		puts("Invalid divider parameter value.");
	} 
	
	/* set clock source to 19.2 MHz oscillator and enable */   
	*GPCTL = 0x5A000011;
	
	uswait(10);
	
	if(get_clk_src() == OSC){
		return OSC;
	}
	else{
	   	return -1;
    }
}

/***************************************

	PWM Operation functions

***************************************/

/*
 * Monitor PWM status register and reset accordingly, internal use only.
 */
void reset_status_reg(){
	
	bool STA2 = isBitSet(STA, 10);
	uswait(10); 
	bool STA1 = isBitSet(STA, 9);
	uswait(10); 
	bool BERR = isBitSet(STA, 8);
	uswait(10); 
	bool RERR1 = isBitSet(STA, 3);
	uswait(10); 
	bool WERR1 = isBitSet(STA, 2);
    uswait(10);
 
	if (!STA1) {
		if (RERR1)
	    	setBit(STA, 3);	// reset RERR1
	  	if (WERR1)
	    	setBit(STA, 2); // reset WERR1
	    if (BERR)
	    	setBit(STA, 8); // reset BERR
	}
	if(!STA2){
		if (RERR1)
	       	setBit(STA, 3); // reset RERR1
	    if (WERR1)
	    	setBit(STA, 2); // reset WERR1
	    if (BERR)
	    	setBit(STA, 8); // reset BERR
	}
   	uswait(10);   
}

/*
 * Set and Clear bits based on Field Name (or Bit position)
 * (Internal PWM Control Register utility function)
 */
void pwm_reg_ctrl(uint8_t n, uint8_t position){
	if(n == 1){
  		setBit(CTL, position);
    }
   	else if(n == 0) {
    	clearBit(CTL, position);
  	}
   	else{
    	puts("Invalid n control parameter. Choose 1 or 0 only.");
   	}
   	uswait(10); 
}

/* 
 * Enable/Disable PWM
 *
 * n = 0 Disable
 * n = 1 Enable
 */
void pwm_enable(uint8_t pin, uint8_t n){

	// Channel 1
	if( pin == 18 || pin == 12) {	  // GPIO 18/12, PHY 12/32     
	    pwm_reg_ctrl(n, 0); 
	}
	// Channel 2
	else if(pin == 13 || pin == 19) { // GPIO 13/19, PHY 33/35
		pwm_reg_ctrl(n, 8); 
	}
	else{
		printf("%s() error: ", __func__);
		puts("Invalid pin.");
	}
}

/* 
 * Enable PWM or M/S (mark/space)
 *
 * n = 0 PWM
 * n = 1 M/S
 */
void pwm_set_mode(uint8_t pin, uint8_t n){

	// Channel 1
	if( pin == 18 || pin == 12) {	  // GPIO 18/12, PHY 12/32     
	    pwm_reg_ctrl(n, 7); 
	}
	// Channel 2
	else if(pin == 13 || pin == 19) { // GPIO 13/19, PHY 33/35
		pwm_reg_ctrl(n, 15); 
	}
	else{
		printf("%s() error: ", __func__);
		puts("Invalid pin.");
	}
}

/*
 * PWM output Reverse Polarity  (duty cycle inversion)
 *
 * n = 0 Normal
 * n = 1 Reverse
 */
void pwm_set_pola(uint8_t pin, uint8_t n){

	// Channel 1
	if( pin == 18 || pin == 12) {	  // GPIO 18/12, PHY 12/32     
		pwm_reg_ctrl(n, 4); 
	}
	// Channel 2
	else if(pin == 13 || pin == 19) { // GPIO 13/19, PHY 33/35
		pwm_reg_ctrl(n, 12); 
	}
	else{
		printf("%s() error: ", __func__);
		puts("Invalid pin.");
	}
}

/*
 * Sets PWM range data or period T of the pulse
 */
void pwm_set_range(uint8_t pin, uint32_t range){

	// Channel 1
	if( pin == 18 || pin == 12) {	  // GPIO 18/12, PHY 12/32     
		*RNG1 = range;
		reset_status_reg();
	}
	// Channel 2
	else if(pin == 13 || pin == 19) { // GPIO 13/19, PHY 33/35
		*RNG2 = range;
		reset_status_reg();
	}
	else{
		printf("%s() error: ", __func__);
		puts("Invalid pin.");
	}
}

/*
 * Sets PWM data or pulse width of the pulse to generate
 */
void pwm_set_data(uint8_t pin, uint32_t data){

    // Channel 1
    if( pin == 18 || pin == 12) {	  // GPIO 18/12, PHY 12/32 
        *DAT1 = data;
		reset_status_reg();
	}
    // Channel 2
  	else if(pin == 13 || pin == 19) { // GPIO 13/19, PHY 33/35
    	*DAT2 = data;
    	reset_status_reg();
  	}
    else{
		printf("%s() error: ", __func__);
		puts("Invalid pin.");
    }
}


/****************************

	I2C Functons

*****************************/

/*
 * I2C register addresses 
 *
 * S 	(C + 0x4/4)  // status
 * DLEN	(C + 0x8/4)  // data length
 * A	(C + 0xC/4)  // slave
 * FIFO	(C + 0x10/4) // fifo
 * DIV	(C + 0x14/4) // div
 * DEL	(C + 0x18/4) // data length
 * CLKT	(C + 0x1C/4) //sretch clk
 *
 */

/* 
 * Start I2C operation
 */
int i2c_start()
{
	if ( C == 0 ){
		printf("%s() error: ", __func__);
		puts("Invalid I2C registers addresses.");
		return 0; 
	}

	set_gpio(2, 4);		// alt 100b, PHY 3, GPIO 2, alt 0	SDA 
	set_gpio(3, 4);		// alt 100b, PHY 5, GPIO 3, alt 0 	SCL 

	mswait(10);
	setBit(C, 15); 		// I2CEN,  enable I2C operation

	return 1; 			// successful i2c initialization
}

/*
 * Set falling and rising clock delay
 *
 * The REDL field specifies the number core clocks to wait after the rising edge before
 * sampling the incoming data.
 *
 * The FEDL field specifies the number core clocks to wait after the falling edge before
 * outputting the next data bit.
 *
 * Note: Care must be taken in choosing values for FEDL and REDL as it is possible to
 * cause the BSC master to malfunction by setting values of CDIV/2 or greater. Therefore
 * the delay values should always be set to less than CDIV/2.
 *
 */
uint32_t set_clock_delay(uint8_t FEDL, uint8_t REDL){

	volatile uint16_t *div = (uint16_t *)DIV;

	volatile uint32_t *del = (uint32_t *)DEL;

	uint32_t fedl = 65535 + FEDL;
	uint8_t redl = REDL;

	if(FEDL < (*div/2) && REDL < (*div/2)){
		*del = fedl + redl;
	}
	else{
		puts("i2c_set_clock_freq() error: Clock delay is higher than cdiv/2.");
		return 1; 	
	}
	return *del;
}

/*
 * Set clock frequency for data transfer using a divisor value
 */
void i2c_set_clock_freq(uint16_t divider)
{
	volatile uint32_t* div = (uint32_t *)DIV;
	*div = divider;

	/* set 1 falling and 1 rising clock cycle delays for SCL */
	if(set_clock_delay(1, 1) < 2){
		printf("internal %s() error: ", __func__);
		puts("Clock delays should be below cdiv/2.");
    }
}

/*
 * Set data transfer speed using directly a clock freq value or baud rate value(bits per second)
 */
void i2c_data_transfer_speed(uint32_t baud)
{
	/* get the divisor value using the 250 MHz system clock source */
    uint32_t divider = (system_clock / baud); 

	i2c_set_clock_freq((uint16_t)divider);
}

/*
 * Clear FIFO buffer
 */
void clear_fifo(volatile uint32_t * reg){
	uint32_t mask = ~ (3 <<  4); 	// clear bit 4 and 5 to 0
	*reg &= mask;					// set mask to value 0
	mask = (3 <<  4); 				// write new value 2 or 1 for I2C or 3 to cover both I2C & SPI to reset FIFO   
	*reg |= mask; 					// set mask to 2 and clear FIFO
}

/*
 * Reset all status register error bits
 */
void reset_error_status(){
	setBit(S, 9); // CLKT field bit
	setBit(S, 8); // ERR field bit
	setBit(S, 1); // DONE field bit
}

/*
 * Slave device address write test, internal use only
 */
uint8_t i2c_slave_write_test(const char * buf, uint8_t len)
{
	volatile uint32_t * dlen  = (uint32_t *)DLEN;
	volatile uint32_t * fifo  = (uint32_t *)FIFO;

	uint8_t result = 0x0; // successful data transfer, no error

	uint8_t i = 0;

	/* Empty fifo buffer from previous write cycle transaction */ 
	clear_fifo(C);

	/* Clear all errors from previous transaction */
	reset_error_status();

	*dlen = len; 	// sets the max. no of bytes for FIFO write cycle

	clearBit(C, 0); // initiate a write data packet transfer
	setBit(C, 7);   // start data transfer

	while(!isBitSet(S, 1))  // if DONE is 1, data transfer is complete
	{
		while(isBitSet(S, 4)) // Check if FIFO is full 
		{
			*fifo = buf[i];
			i++;
		}
	}

	/* Received a NACK error, address not acknowledge by slave device */
	if(isBitSet(S, 8)){
		result = 0x01;  
		puts("i2c_select_slave() error: Address not acknowledged by slave device.");
	}

	/* write cycle is success */
	if(isBitSet(S, 1) && !isBitSet(S, 0)){
		setBit(S, 1); // DONE, write transfer is completed
	}
	else{
		result = 0x04;
	   	puts("i2c_select_slave() error: Data transfer is not complete.");
	}

	return result;
}


/*
 * Get slave device address
 */
void i2c_select_slave(uint8_t addr)
{
	volatile uint32_t *a = (uint32_t *)A; 
	*a = addr;

	char buf[2] = { 0x01 };

	/* check slave adress write error */
	if(i2c_slave_write_test(buf, 1) > 0){
		puts("Please check slave device address or slave pin connection.");
	}
}

/*
 * Write a number of bytes to slave device
 */
uint8_t i2c_write(const char * wbuf, uint8_t len)
{
	volatile uint32_t * dlen   	= (uint32_t *)DLEN;
	volatile uint32_t * fifo   	= (uint32_t *)FIFO;

	uint8_t result = 0; // successful write data transfer, no error

	uint8_t i = 0;

	/* Empty fifo buffer from previous write cycle transaction */ 
	clear_fifo(C);

	/* Clear all errors from previous transaction */
	reset_error_status();

	*dlen = len; // sets the max. no of bytes for FIFO write cycle

	if( len > 16){
		printf("%s() warning: ", __func__); 
		puts("Maximum number of bytes per one write cycle is 16 bytes, beyond this data will be ignored.");
		len = 16;
	}

	clearBit(C, 0); // initiate a write data packet transfer
	setBit(C, 7);   // start data transfer

	while(!isBitSet(S, 1))  	// if DONE is 1, data transfer is complete
	{
		while(isBitSet(S, 2))   //2 TXW = 0 FIFO is full, TXW = 1 FIFO has space for at least one byte
		// or 
		{	//4 TXD = 0 FIFO is full, TXD = 1 FIFO has space for at least one byte 
			*fifo = wbuf[i];
			i++;
		}
	}

	/* ERROR_NACK, slave addrress not acknowledge */
	if(isBitSet(S, 8)){
		result = 1;
		printf("%s() error: ", __func__);  
		puts("Slave address not acknowledged.");
	}

	/* ERROR_CLKT, clock stretch timeout. Received Clock Stretch Timeout */
	if(isBitSet(S, 9))
	{
		result = 2;
		printf("%s() error: ", __func__); 
		puts("Clock stretch timeout.");
	}

	/* Not all data is sent */
	if (isBitSet(S, 2) || i < len) //4 TXW = 0 FIFO is full, TXW = 1 FIFO has space for at least one byte
	{
		result = 4;
		printf("%s() error: ", __func__);
		puts("Not all data is sent to slave device.");
	}

	/* write cycle is success */
	if(isBitSet(S, 1) && !isBitSet(S, 0)){
		setBit(S, 1); //DONE, write transfer is complete
	}
	else{
		result = 4;
		printf("%s() error: ", __func__); 
		puts("Data transfer is not complete.");
	}

	return result;
}

/*
 * Read a number of bytes from a slave device
 */
uint8_t i2c_read(char* rbuf, uint8_t len)
{
	volatile uint32_t * dlen 	= (uint32_t *)DLEN; 
	volatile uint32_t * fifo    = (uint32_t *)FIFO;

	uint8_t result = 0; // successful read operation, no error

	uint8_t i = 0;

	/* Empty fifo buffer from previous write cycle transaction */ 
	clear_fifo(C);

	/* Clear all errors from previous transaction */
	reset_error_status();

	/* Set data length */
	*dlen = len;  

	/* Start a read transfer */
	setBit(C, 0); // READ initiate a read data packet transfer
	setBit(C, 7); // ST start the data read transfer

	while(!isBitSet(S, 1))  // if DONE is 1, data transfer is complete
	{
    	while(isBitSet(S, 5) && i < len) //5 RXD = 0 fifo is empty, RXD = 1 still has data
		{
    		rbuf[i] = *fifo;
    		i++;
		}
	}

	if(isBitSet(S, 1) && !isBitSet(S, 0)){
		setBit(S, 1); // if DONE is 1, data transfer is complete
	}
	else{
		result = 4;
        printf("%s() error: ", __func__);
    	puts("Data transfer is not complete.");
	}

	/* ERROR_NACK, slave addrress not acknowledge */
	if(isBitSet(S, 8)){
		result = 1;
		printf("%s() error: ", __func__);
    	puts("Slave address is not acknowledged.");
	}

	/* ERROR_CLKT, clock stretch timeout */
	else if(isBitSet(S, 9))
	{
		result = 2;
		printf("%s() error: ", __func__); 
    	puts("Clock stretch timeout.");
	}

	/* ERROR_DATA, not all data is received */
	else if (isBitSet(S, 5) || i < len) // RXD 0 = FIFO is empty. 1 = FIFO contains at least 1 byte.
	{
		result = 4;
		printf("%s() error: ", __func__); 
    	puts("Not all data is received from slave device.");
	}

	return result;
}

/*
 * Read one byte of data from the slave device
 */
uint8_t i2c_byte_read(void){

	volatile uint32_t * dlen 	= (uint32_t *)DLEN;
	volatile uint32_t * fifo    = (uint32_t *)FIFO;

	uint8_t result = 0; // successful read operation, no error

	/* Empty fifo buffer from previous write cycle transactions */ 
	clear_fifo(C);

	/* Clear all errors from previous transactions */
	reset_error_status();

	/* Start read */
	setBit(C, 0); // Control Register READ bit, initiate a read packet data transfer
	setBit(C, 7); // Control Register ST bit, start the data transfer

	/* Set Data Length */
	*dlen = 1; // one byte only   

	uint8_t data = 0;

	/* keep reading data from fifo until Status Register DONE bit is 1 */
	while(!isBitSet(S, 1))  // 0 = Transfer not completed. 1 = Transfer completed. Cleared by writing 1 to the field 
	{
		/* read data from FIFO register */
		while(isBitSet(S, 5)) // Status Register RXD bit, 0 = fifo is empty, 1 = still has data
		{
			data = *fifo;
		}
	}

	/* Check Status Register DONE and TA bit */
	if(isBitSet(S, 1) && !isBitSet(S, 0)){
		setBit(S, 1); 
	}
	else{
		printf("%s() error: ", __func__);
		puts("Data transfer is not complete.");
		return result = 4;
	}

	/* ERROR_NACK, slave address is not acknowledged by slave device */
	if(isBitSet(S, 8))
	{
		printf("%s() error: ", __func__);
		puts("Slave address is not acknowledged.");
		return result = 1; 
	}

	/* ERROR_CLKT, clock stretch timeout error */
	if(isBitSet(S, 9))
	{
		printf("%s() error: ", __func__);
		puts("Clock stretch timeout.");
		return result = 2; 
	}

	/* ERROR_DATA, not all data is received */
	if (isBitSet(S, 5))
	{
		printf("%s() error: ", __func__);
		puts("Not all data is received.");
		return result = 4; 
	}

	return data;
}

/*
 * Stop I2C operation, reset pin as input
 */
void i2c_stop() {

	/* Empty fifo buffer from previous write cycle transaction */ 
	clear_fifo(C);

	/* Clear all errors from previous transaction */
	reset_error_status();

	clearBit(C, 15);	/* I2CEN,  disable I2C operation */

	set_gpio(2, 0);		/* alt 00b, PHY 3, GPIO 2, alt 0 	SDA */
	set_gpio(3, 0);     /* alt 00b, PHY 5, GPIO 3, alt 0 	SCL */
}


/****************************

	SPI Functons

*****************************/
/* 
 * SPI register addresses 
 * 
 * SPI_CS 	(base_pointer[6] + 0x0)  
 * SPI_FIFO	(SPI_CS + 0x4/4)
 * SPI_CLK	(SPI_CS + 0x8/4)
 * SPI_DLEN	(SPI_CS + 0xC/4)
 * SPI_LTOH	(SPI_CS + 0x10/4)
 * SPI_DC	(SPI_CS + 0x14/4)
 *
 */

/*
 * Start SPI operation
 */
int spi_start()
{
	__sync_synchronize(); 
	if ( SPI_CS == 0 ){
	printf("%s() error: ", __func__);
  		puts("Invalid SPI registers addresses.");
  		return 0; 
	}

	set_gpio(8,  4);  // PHY 24, GPIO 8,  using value 100 , set to alt 0    CE0
	set_gpio(7,  4);  // PHY 26, GPIO 7,  using value 100 , set to alt 0	CE1
	set_gpio(10, 4);  // PHY 19, GPIO 10, using value 100 , set to alt 0    MOSI
	set_gpio(9,  4);  // PHY 21, GPIO 9,  using value 100 , set to alt 0 	MISO
	set_gpio(11, 4);  // PHY 23, GPIO 11, using value 100 , set to alt 0	SCLK

	mswait(10);

	clearBit(SPI_CS, 13); 	// set SPI to SPI Master (Standard SPI)
	clear_fifo(C); 		// Clear SPI TX and RX FIFO 

	return 1;
}

/*
 * Stop SPI operation
 */
void spi_stop() {

	clear_fifo(C);	// Clear SPI TX and RX FIFO 

	set_gpio(8,  0);  // PHY 24, GPIO 8,  using value 0 , set to input  CE0
	set_gpio(7,  0);  // PHY 26, GPIO 7,  using value 0 , set to input  CE1
	set_gpio(10, 0);  // PHY 19, GPIO 10, using value 0 , set to input  MOSI
	set_gpio(9,  0);  // PHY 21, GPIO 9,  using value 0 , set to input  MISO
	set_gpio(11, 0);  // PHY 23, GPIO 11, using value 0 , set to input  SCLK
}

/*
 * Set SPI clock frequency
 */
void spi_set_clock_freq(uint16_t divider){

	volatile uint32_t* div = (uint32_t *)SPI_CLK;

    *div = divider;
}

/*
 * Set SPI data mode
 *
 * SPI Mode0 = 0,  CPOL = 0, CPHA = 0
 * SPI Mode1 = 1,  CPOL = 0, CPHA = 1
 * SPI Mode2 = 2,  CPOL = 1, CPHA = 0
 * SPI Mode3 = 3,  CPOL = 1, CPHA = 1
 *
 */
void spi_set_data_mode(uint8_t mode){
           
    // alternate code
    /*
	  volatile uint32_t* cs = (uint32_t *)SPI_CS;
	  uint32_t mask = ~ (3 <<  2);	// clear bit position 2 and 3 first
	  *cs &= mask;		  			// set mask to 0
	  mask = (mode <<  2); 	  		// write mode value to set SPI data mode   
	  *cs |= mask; 		  			// set data mode
    */

	if(mode == 0){
		clearBit(SPI_CS, 2); 		//CPHA 0
    	clearBit(SPI_CS, 3); 		//CPOL 0
	}
	else if(mode == 1){
		setBit(SPI_CS, 2);			//CPHA 1
    	clearBit(SPI_CS, 3);    	//CPOL 0
	}
	else if(mode == 2){		
		clearBit(SPI_CS, 2);		//CPHA 0
		setBit(SPI_CS, 3);			//CPOL 1
	}
	else if(mode == 3){
		clearBit(SPI_CS, 2);		//CPHA 1
		clearBit(SPI_CS, 3);		//CPOL 1
	}
    else{
		printf("%s() error: ", __func__);
		puts("invalid mode");
    }
}

/*
 * SPI Chip Select
 *
 * 0  (00) = Chip select 0
 * 1  (01) = Chip select 1
 * 2  (10) = Chip select 2
 * 3  (11) = Reserved
 */
void spi_chip_select(uint8_t cs)
{
	volatile uint32_t* cs_addr = (uint32_t *)SPI_CS;

	uint32_t mask = ~ (3 <<  0);	// clear bit 0 and 1 first
	*cs_addr &= mask;				// set mask to value 0
	mask = (cs <<  0);	 			// write cs value to set SPI data mode   
	*cs_addr |= mask; 				// set cs value 
}

/*
 * Set chip select polarity
 */
void spi_set_chip_select_polarity(uint8_t cs, uint8_t active)
{
	/* Mask the appropriate CSPOLn bit */
	clearBit(SPI_CS, 21);
	clearBit(SPI_CS, 22);
	clearBit(SPI_CS, 23); 

	if(cs == 0 && active == 0) { 
		clearBit(SPI_CS, 21);
	}
	else if(cs == 0 && active == 1){
    	setBit(SPI_CS, 21);
	}
	else if(cs == 1 && active == 0){
		clearBit(SPI_CS, 22);
	}
	else if(cs == 1 && active == 1){
		setBit(SPI_CS, 22);
	}
	else if(cs == 2 && active == 0){
		clearBit(SPI_CS, 23);
	}
	else if(cs == 2 && active == 1){
		setBit(SPI_CS, 23);
	}
}

/*
 * Writes and reads a number of bytes to/from a slave device
 */
void spi_data_transfer(char* wbuf, char* rbuf, uint8_t len)
{
	volatile uint32_t* fifo = (uint32_t *)SPI_FIFO;

	uint32_t w = 0; // write count index 
	uint32_t r = 0; // read count index

	/* Clear TX and RX fifo's */
	clear_fifo(SPI_CS);

	/* Set TA = 1 to start data transfer */
	setBit(SPI_CS, 7);   // done = 1

	/* Write data to FIFO */
	while (w < len) 
	{
    	// TX fifo is not full, add/write more bytes
    	while(isBitSet(SPI_CS, 18) && (w < len))
    	{
       		*fifo = wbuf[w];
       		w++;
     	}
	}

	/* read data from FIFO */
	while (r < len)
	{ 
    	// RX fifo is not empty, read more received bytes 
		while(isBitSet(SPI_CS, 17) && (r < len ))
    	{
       		rbuf[r] = *fifo;
       		r++;
    	}
	}

	/* Set TA = 0, transfer is done */
	clearBit(SPI_CS, 7);  // Done = 0

	/* DONE should be zero for complete data transfer */
	if(isBitSet(SPI_CS, 16)){
        printf("%s() error: ", __func__);
    	puts("data transfer error");
	}
}

/*
 * Writes a number of bytes to SPI device
 */
void spi_write(char* wbuf, uint8_t len)
{
	volatile uint32_t* fifo = (uint32_t *)SPI_FIFO;

	/* Clear TX and RX fifo's */
	clear_fifo(SPI_CS);

	/* start data transfer, set TA = 1 */
	setBit(SPI_CS, 7); 

	uint8_t i = 0;

	while (i < len) 
	{
		// TX fifo is not full, add/write more bytes
		while(isBitSet(SPI_CS, 18) && (i < len))
		{
	   		*fifo = wbuf[i];
	   		i++;
	 	}
	}
}

/*
 * read a number of bytes from SPI device
 */
void spi_read(char* rbuf, uint8_t len)
{
	volatile uint32_t* fifo = (uint32_t *)SPI_FIFO;

	if(!isBitSet(SPI_CS, 7)){
		printf("%s() error: ", __func__);
		puts("Nothing to read from fifo.");
		return;
	}

	/* continue data transfer from spi_write start transfer */
	//setBit(SPI_CS, 7); // no need to start data transfer

	uint8_t i = 0;

	while (i < len) 
	{
		// TX fifo is not full, add/write more bytes
		while(isBitSet(SPI_CS, 17) && (i < len))
		{
	   		rbuf[i] = *fifo;
	   		i++;
	 	}
	}

	/* Set TA = 0, transfer is done */
	clearBit(SPI_CS, 7);
}




