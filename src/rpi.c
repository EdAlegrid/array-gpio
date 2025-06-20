/**
 * rpi.c
 *
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

// Documentation References
// https://www.raspberrypi.com/documentation/computers/raspberry-pi.html
// https://www.raspberrypi.com/documentation/computers/processors.html

//#define debug 0

/* Peripherals base addresses for different Rpi models */
#define	PERI_BASE_1  	0x20000000 // Rpi 1 & Rpi Zero/Rpi Zero W
#define	PERI_BASE_2 	0x3F000000 // Rpi 2 & 3
#define	PERI_BASE_3		0xFE000000 // Rpi 4

/* Common core clock frequency for all RPI models */
//#define CORE_CLK_FREQ		250000000 // 250 MHz 

/* Base address of each peripheral registers based on the Rpi model */
#define ST_BASE		(peri_base + 0x003000)		// 0x7E003000
#define GPIO_PADS 	(peri_base + 0x100000)		// 0x7E100000 unused
#define CLK_BASE 	(peri_base + 0x101000)		// 0x7E101000 
#define GPIO_BASE	(peri_base + 0x200000)		// 0x7E200000
#define SPI0_BASE	(peri_base + 0x204000)		// 0x7E204000 SPI0
#define BSC0_BASE	(peri_base + 0x205000)		// 0x7E205000 BSC0 // GPIO 00 & 01/pin 27 & 28
#define PWM_BASE 	(peri_base + 0x20C000)		// 0x7E20C000 PWM0 
#define AUX_BASE	(peri_base + 0x215000)		// 0x7E215000 unused
#define SPI1_BASE	(peri_base + 0x215080)		// 0x7E215080 unused
#define SPI2_BASE	(peri_base + 0x2150C0)		// 0x7E2150C0 unused
#define BSC1_BASE	(peri_base + 0x804000)		// 0x7E804000 BSC1 // GPIO 02 & 03/pin 03 & 05

/* Size of memory block or length of bytes to be used during mmap() */
#define	BLOCK_SIZE	(4*1024)

/* System timer registers */
#define ST_PERI_BASE	base_pointer[0]	 // ST_BASE 

#define ST_CS		(ST_PERI_BASE + 0x00/4) 
#define ST_CLO	    (ST_PERI_BASE + 0x04/4)
#define ST_CHI_CLO	(ST_PERI_BASE + 0x08/4)
#define ST_C0		(ST_PERI_BASE + 0x0C/4)
#define ST_C1		(ST_PERI_BASE + 0x10/4)
#define ST_C2		(ST_PERI_BASE + 0x14/4)
#define ST_C3	    (ST_PERI_BASE + 0x18/4)
 
/* PWM control manager clocks control registers
 * https://www.scribd.com/doc/127599939/BCM2835-Audio-clocks
 * 0x28 hex/40 dec from 0x7e1010+(a0/4) CM_PWMCTL or using 0x20 hex/32 dec from 0x7e1010+(80/4) CM_GP2CTL
 * 0x29 hex/41 dec from 0x7e1010+(a4/4) CM_PWMDIV or using 0x21 hex/33 dec from 0x7e1010+(84/4) CM_GP2DIV
 */
#define CM_PWMCTL (base_pointer[1] + 0x80/4) 	// CLK_BASE
#define CM_PWMDIV (base_pointer[1] + 0x84/4) 	// CLK_BASE

/* GPIO peripheral registers (not all registers are used)
 * Each register has a 32-bit word size
 */
#define GPIO_PERI_BASE	base_pointer[2]	// GPIO_BASE
#define GPIO_GPFSEL0	(GPIO_PERI_BASE + 0x00/4)
#define GPIO_GPFSEL1	(GPIO_PERI_BASE + 0x04/4)
#define GPIO_GPFSEL2	(GPIO_PERI_BASE + 0x08/4)
#define GPIO_GPFSEL3	(GPIO_PERI_BASE + 0x0C/4)
#define GPIO_GPFSEL4	(GPIO_PERI_BASE + 0x10/4)
#define GPIO_GPFSEL5	(GPIO_PERI_BASE + 0x14/4)
#define GPIO_GPSET0	    (GPIO_PERI_BASE + 0x1C/4)
#define GPIO_GPSET1	    (GPIO_PERI_BASE + 0x20/4)
#define	GPIO_GPCLR0	    (GPIO_PERI_BASE + 0x28/4)
#define	GPIO_GPCLR1	    (GPIO_PERI_BASE + 0x2C/4)
#define GPIO_GPLEV0	    (GPIO_PERI_BASE + 0x34/4)
#define GPIO_GPLEV1	    (GPIO_PERI_BASE + 0x38/4)
#define	GPIO_GPEDS0	    (GPIO_PERI_BASE + 0x40/4)
#define	GPIO_GPEDS1	    (GPIO_PERI_BASE + 0x44/4) 		
#define GPIO_GPREN0	    (GPIO_PERI_BASE + 0x4C/4)
#define GPIO_GPREN1	    (GPIO_PERI_BASE + 0x50/4) 		
#define	GPIO_GPFEN0	    (GPIO_PERI_BASE + 0x58/4)
#define	GPIO_GPFEN1	    (GPIO_PERI_BASE + 0x5C/4)		
#define GPIO_GPHEN0	    (GPIO_PERI_BASE + 0x64/4) 
#define GPIO_GPHEN1	    (GPIO_PERI_BASE + 0x68/4) 		
#define	GPIO_GPLEN0	    (GPIO_PERI_BASE + 0x70/4) 		
#define	GPIO_GPAREN0	(GPIO_PERI_BASE + 0x7C/4)
#define	GPIO_GPAREN1	(GPIO_PERI_BASE + 0x80/4) 		
#define	GPIO_GPAFEN0	(GPIO_PERI_BASE + 0x88/4)
#define	GPIO_GPAFEN1	(GPIO_PERI_BASE + 0x8C/4)  		
#define GPIO_GPPUD	    (GPIO_PERI_BASE + 0x94/4) 		
#define GPIO_GPPUDCLK0	(GPIO_PERI_BASE + 0x98/4)	
#define GPIO_GPPUDCLK1	(GPIO_PERI_BASE + 0x9C/4)

/* BCM2711 (rpi4) gpio pull-up/down registers  */
#define GPIO_GPPUPPDN0  (GPIO_PERI_BASE + 0xe4/4)	// for pins 0 ~ 15  
#define GPIO_GPPUPPDN1  (GPIO_PERI_BASE + 0xe8/4)	// for pins 16 ~ 31 
#define GPIO_GPPUPPDN2  (GPIO_PERI_BASE + 0xec/4) 	// for pins 32 ~ 47 
#define GPIO_GPPUPPDN3  (GPIO_PERI_BASE + 0xf0/4)   // for pins 48 ~ 57 

/* PWM control and status registers */
#define PWM_PERI_BASE	base_pointer[3]	// from 4 PWM_BASE
#define PWM_CTL		(PWM_PERI_BASE + 0x00/4) 			
#define PWM_STA		(PWM_PERI_BASE + 0x04/4)		
#define PWM_RNG1	(PWM_PERI_BASE + 0x10/4)
#define PWM_DAT1	(PWM_PERI_BASE + 0x14/4)
#define PWM_FIF1	(PWM_PERI_BASE + 0x18/4)
#define PWM_RNG2 	(PWM_PERI_BASE + 0x20/4)
#define PWM_DAT2	(PWM_PERI_BASE + 0x24/4)

/* SPI registers */
#define SPI_PERI_BASE	base_pointer[4]	// from 3 SPI0_BASE
#define SPI_CS		(SPI_PERI_BASE + 0x00/4) 
#define SPI_FIFO	(SPI_PERI_BASE + 0x04/4)
#define SPI_CLK		(SPI_PERI_BASE + 0x08/4)
#define SPI_DLEN	(SPI_PERI_BASE + 0x0C/4)
#define SPI_LTOH	(SPI_PERI_BASE + 0x10/4)
#define SPI_DC		(SPI_PERI_BASE + 0x14/4)

/* I2C registers */
#define I2C_PERI_BASE	base_pointer[5]	// BSC1_BASE
#define I2C_C		(I2C_PERI_BASE + 0x00/4)
#define I2C_S		(I2C_PERI_BASE + 0x04/4)  
#define I2C_DLEN	(I2C_PERI_BASE + 0x08/4)  
#define I2C_A		(I2C_PERI_BASE + 0x0C/4) 
#define I2C_FIFO	(I2C_PERI_BASE + 0x10/4) 
#define I2C_DIV		(I2C_PERI_BASE + 0x14/4) 
#define I2C_DEL		(I2C_PERI_BASE + 0x18/4) 
#define I2C_CLKT	(I2C_PERI_BASE + 0x1C/4)

/* Size of info[] array */
#define INFO_SIZE 100

/* Dynamic peripheral base address array */
volatile uint32_t base_add[10] = {}; // ininialize each element to 0

/* Dynamic peripheral base address array pointer
 * This is the return mapped address of each peripheral base address
 */
volatile uint32_t *base_pointer[10] = {}; // ininialize each element to 0

/* page_size variable */
uint32_t page_size = 0; 

/* Peripheral base address variable. The value of which will be determined
 * depending on the board type (Pi zero, 3 or 4) at runtime
 */
volatile uint32_t peri_base = 0;

/* core_clock frequency for for all RPI models */
uint32_t core_clock_freq = 250000000; // 250 MHz 

/**********************************

   RPI Initialization Functions

***********************************/
uint8_t cpu_type = 0, init_devmem = 0, init_gpiomem = 0, rpi_init_access = 0;

void get_cpu_type(){
	FILE *fp;
	char info[INFO_SIZE];
	
	fp = fopen("/proc/cpuinfo", "r");
	
	if (fp == NULL) {
		fputs ("fopen /proc/cpuinfo error", stderr);
		exit(1);
	}

	while (fgets (info, INFO_SIZE, fp) != NULL){
		if (strncmp (info, "Model", 5) == 0)
      		break;
	}

	if(debug) printf("%s", info);

  	if(strstr(info, "Pi Zero")||strstr(info, "Pi 1")){
		if(debug) puts("Pi zero/Pi 1");
	 	peri_base = PERI_BASE_1;
        cpu_type = 1;
  	}
	else if(strstr(info, "Pi Zero 2")||strstr(info, "Pi 3")){
		if(debug) puts("Pi Zero 2/Pi 3");
  		peri_base = PERI_BASE_2;
		cpu_type = 2; 
  	}
	else if(strstr(info, "Pi Compute Module 3")){
		if(debug) puts("Pi Compute Module 3 Model");
  		peri_base = PERI_BASE_2;
        cpu_type = 3;
  	}
	else if(strstr(info, "Pi 4")||strstr(info, "Pi Compute Module 4")){
		if(debug) puts("Pi 4 Model B/Pi Compute Module 4");
  		peri_base = PERI_BASE_3;
        cpu_type = 4; 
  	}
	else if(strstr(info, "Pi 400")){
		if(debug) puts("Pi 400 Model");
  		peri_base = PERI_BASE_3;
		cpu_type = 4;	
  	}
	else{
		if(debug) puts("Other Rpi Model");			
		cpu_type = 0; 
  	}

	if(ST_BASE == 0x3000){
		puts("peri_base address initialization error:");
		printf("Target ST_BASE: %X\n", peri_base);
		printf("Actual ST_BASE: %X\n", ST_BASE);
		exit(1);	
  	}
	
    if(debug){
		// 'Hardware' info 
  	rewind (fp);
  	while (fgets (info, INFO_SIZE, fp) != NULL){
  		if (strncmp (info, "Hardware", 8) == 0)
   			break ;
  	}
  	printf("%s", info); // show Hardware line info

  	// 'Revision' info 
	rewind (fp);
  	while (fgets (info, INFO_SIZE, fp) != NULL){
  		if (strncmp (info, "Revision", 8) == 0)
  			break ;
  	}
    // show Revision line info
  	printf("%s", info);
	}

	fclose(fp);
}

/* Set each peripheral register on demand */   
uint8_t set_each_peri_mmap(uint8_t peri_type){
	int fd = 0;
	char *mem = NULL, *type = NULL; 
	uint8_t i = 0, end_index = 0, start_index = 0;	
    
	if(peri_type == 0 && init_gpiomem == 0){
		mem = "/dev/gpiomem", type = "gpio"; 
		start_index = 0, end_index = 3;
		base_add[0] = ST_BASE;
		base_add[1] = CLK_BASE;
		base_add[2] = GPIO_BASE;
	}
	else if(peri_type == 1){
		mem = "/dev/mem", type = "pwm"; 
		start_index = 3, end_index = 4;
		base_add[3] = PWM_BASE;
	}
	else if(peri_type == 2){
		mem = "/dev/mem", type = "spi"; 
		start_index = 4, end_index = 5;
		base_add[4] = SPI0_BASE;
	}
	else if(peri_type == 3){
		mem = "/dev/mem", type = "i2c"; 
		start_index = 5, end_index = 7;	
		base_add[5] = BSC1_BASE;
		//base_add[6] = BSC0_BASE;
	}
	else{
		return 1;
	}
	
	uswait(5);

	if((fd = open(mem, O_RDWR|O_SYNC)) < 0) {
		if(peri_type == 0){
			if(debug) printf("open error: %s, %s, %u\n", mem, type, peri_type);
			perror("Opening gpio in /dev/gpiomem");
			printf("%s() error: ", __func__);
		}
		else {
			if(debug) printf("open error: %s, %s, %u\n", mem, type, peri_type);
			perror("Opening pwm, spi or i2c in /dev/mem requires root access");
			puts("Try running your app in root or sudo\n");
		}
		exit(1);
	}
    
	uswait(5);
   
	for(i = start_index; i < end_index; i++){ 
		base_pointer[i] = mmap(NULL, BLOCK_SIZE, PROT_READ|PROT_WRITE, MAP_SHARED, fd, base_add[i]);

		if (base_pointer[i] == MAP_FAILED) {
			perror("set_each_peri_mmap error");
			printf("%s() error: ", __func__);
			if(close(fd) < 0){
				perror("map failed - fd close");
				exit(1);
			}
		}
        
		if(debug){
   		printf("base_add[i]: %lu\n", (unsigned long)base_add[i]);
     	printf("base_pointer[i]: %lu\n", (unsigned long)base_pointer[i]);
		}

		// Note: Disable this for SocketCan operation
		*base_pointer[i] = 0;
		uswait(5);
	}

	if(peri_type == 0 && init_gpiomem == 0){
		init_gpiomem = 1;
	}

	if(close(fd) < 0){
		perror("set_each_peri_mmap - fd close");
	}

	if(debug) printf("set individual mmap success: %s, %s, %u\n", mem, type, peri_type);

	return 0; 
}

/* Set gpio peripheral register and other registers (pwm, i2c, spi) on demand */  
uint8_t set_all_peri_mmap(uint8_t access){
	int fd = 0;
	char *mem = NULL, *type = NULL; 
	uint8_t i, end_index = 0, start_index = 0;

	base_add[0] = ST_BASE;
	base_add[1] = CLK_BASE;
	base_add[2] = GPIO_BASE;
	base_add[3] = PWM_BASE;
	base_add[4] = SPI0_BASE;
	base_add[5] = BSC1_BASE;
	//base_add[6] = BSC0_BASE;

	// access = 0, non-root
	if (access == 0 && init_gpiomem == 0){
		mem = "/dev/gpiomem", type = "gpio"; 
		start_index = 0, end_index = 3; 		
	}
 	// access = 1, root
	else if(access == 1 && init_devmem == 0) {
		mem = "/dev/mem", type = "pwm, i2c, spi"; 
		start_index = 3, end_index = 7;
	}
	else{
		return 1;
	}

	if((fd = open(mem, O_RDWR|O_SYNC)) < 0) {
		if(access == 0){
			if(debug) printf("open error: %s, %s, %u\n", mem, type, access);
			perror("Opening gpio in /dev/gpiomem");
			printf("%s() error: ", __func__);
		}
		else {
			if(debug) printf("open error: %s, %s, %u\n", mem, type, access);
			perror("Opening pwm, spi or i2c in /dev/mem requires root access");
			puts("Try running your app in root or sudo\n");
		}
		exit(1);
	}

	for(i = start_index; i < end_index; i++){

		base_pointer[i] = mmap(NULL, BLOCK_SIZE, PROT_READ|PROT_WRITE, MAP_SHARED, fd, base_add[i]);

		if (base_pointer[i] == MAP_FAILED) {
   		perror("set_all_peri_mmap error");
			printf("%s() error: ", __func__);

   		if(close(fd) < 0){
				perror("fd close");
				exit(1);
			}
 		}

		uswait(5);

		// Note: Disable this for SocketCan operation
 		*base_pointer[i] = 0; 
	}

	if(access == 0 && init_gpiomem == 0){
		init_gpiomem = 1;
	}
	else if(access == 1 && init_devmem == 0){
		init_devmem = 1;
	}

	if(close(fd) < 0)
		perror("set_all_peri_mmap - fd close");

	if(debug) printf("set all mmap success: %s, %s, %u\n", mem, type, access);

	return 0;
}

/* Initialize GPIO, PWM, I2C and SPI Peripheral Base Register Adressses using mmap()
 *
 * access = 0	("/dev/gpiomem") 	// GPIO
 * access = 1	("/dev/mem") 		// PWM, I2C, SPI
 */
void rpi_init(uint8_t access) {
	get_cpu_type();
	if(access == 1){
		set_all_peri_mmap(0);
	}
	set_all_peri_mmap(access);
	rpi_init_access = 1;
}

/* Close the library and reset all memory pointers to 0 or NULL
 */
uint8_t rpi_close()
{
	uint32_t i;
    uint8_t end_index = 7;

    rpi_init_access = 1;

	for(i = 0; i < end_index; i++){
	 	if (munmap((uint32_t *) base_pointer[i] , BLOCK_SIZE) < 0){
  			perror("munmap() error");
			printf("%s() error: ", __func__);
			puts("munmap() operation fail"); 
			return -1;
  		}
	}

  	return 0;
}

/*****************************************

   	Time Delay Functions

   1 ms = 1000 us or microsecond
   1 ms = 1000000 ns or nanosecond
   1 ms = 0.001 or 1/1000 sec

   1 sec = 1000 ms
   1 sec = 1000000 us or microsecond
   1 sec = 1000000000 ns or nanosecond

******************************************/

/* Time delay function in nanoseconds */
void nswait(uint64_t ns) { 
 	struct timespec req = { ns / 1000000, ns % 1000000 };  
 	struct timespec rem;

  	while ( nanosleep(&req,&rem) == -1 )
   		req.tv_nsec = rem.tv_nsec;
}

/* Time delay function in microseconds, valid only if us is below 1000 */
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

/*********************************************************

    Register Bit Manipulation and Read/Write Functions

**********************************************************/

/* Set register bit position to 1 (ON state) */  
uint32_t setBit(volatile uint32_t* reg, uint8_t position)
{
	volatile uint32_t result = 0; 
	uint32_t mask = 1 << position;
	__sync_synchronize();
	result = *reg |= mask;
	__sync_synchronize();
	return result;
}

/* Set register bit position to 0 (OFF state) */  
uint32_t clearBit(volatile uint32_t* reg, uint8_t position)
{
	volatile uint32_t result = 0; 
	uint32_t mask = 1 << position;
	__sync_synchronize();
	result = *reg &= ~mask;
	__sync_synchronize();
	return result;
}

/* Check register bit position value - 0 (OFF state) or 1 (ON state) */  
uint8_t isBitSet(volatile uint32_t* reg, uint8_t position)
{
	uint32_t mask = 1 << position;
	return *reg & mask ? 1 : 0;
}

/* Read content of a peripheral register */
uint32_t pr_read(volatile uint32_t* reg)
{
	return *reg;
}

/* Write a value to a peripheral register  */
uint32_t pr_write(volatile uint32_t* reg,  uint32_t value)
{
	*reg = value;
	return *reg;
}

/******************************

    GPIO Control Functions

*******************************/
/* Initialize only the gpio peripheral register */
void gpio_init(){
    if(rpi_init_access == 0){
		get_cpu_type();
    	set_each_peri_mmap(0);
    }

	mswait(5);

    if(debug) printf("GPIO_PERI_BASE: %lu\n", (unsigned long)GPIO_PERI_BASE);

	__sync_synchronize(); 
    if (GPIO_PERI_BASE == 0){
		printf("%s() error: ", __func__);
        puts("Invalid memory-mapped GPIO peripheral base register");
  		exit(1);
	}
}

/*
 * Set a GPIO pin based on fsel hex value
 *
 *  fsel hex values  fsel binary values   GPIO pin function 
 *
 *  0x0		     000		GPIO Pin is an input
 *  0x1		     001		GPIO Pin is an output
 *  0x4		     100		GPIO Pin takes alternate function 0
 *  0x5		     101		GPIO Pin takes alternate function 1
 *  0x6		     110		GPIO Pin takes alternate function 2
 *  0x7		     111		GPIO Pin takes alternate function 3
 *  0x3		     011		GPIO Pin takes alternate function 4
 *  0x2		     010		GPIO Pin takes alternate function 5
 *
 */
void set_gpio(uint8_t pin, uint8_t fsel){
	/* get base address (GPFSEL0 to GPFSEL5) using *(GPFSEL0 + (pin/10))
	 * get mask using (alt << ((pin)%10)*3)
	 */

	// get the GPFSEL0 pointer (GPFSEL0 ~ GPFSEL5) based on the pin number selected
	volatile uint32_t *gpsel = (uint32_t *)(GPIO_GPFSEL0 + (pin/10));
	uint32_t mask = ~ (7 <<  (pin % 10)*3);	// mask to reset fsel to 0 first
	*gpsel &= mask;   					     	// reset gpsel value to 0
	mask = (fsel <<  ((pin) % 10)*3);	      	// mask for new fsel value   
	__sync_synchronize();
	*gpsel |= mask; 					     	// write new fsel value to gpselect pointer
	__sync_synchronize();
}

/* Set a GPIO pin as input
 */
void gpio_input(uint8_t pin){
	set_gpio(pin, 0);
} 

/* Set a GPIO pin as output
 */
void gpio_output(uint8_t pin){
  	set_gpio(pin, 1);
}

/* Configure GPIO pin as input or output
 *
 * mode = 0 	input
 * mode = 1 	output
 * mode = 4 	alternate function 0 
 * mode = 5 	alternate function 1
 * mode = 6 	alternate function 2 
 * mode = 7 	alternate function 3
 * mode = 3 	alternate function 4 
 * mode = 2 	alternate function 5
 */
void gpio_config(uint8_t pin, uint8_t mode) {
	if(mode == 0){ 
		set_gpio(pin, 0);		// input
	}
	else if(mode == 1){
		set_gpio(pin, 1);		// output
	}
	else if(mode == 4){
		set_gpio(pin, 4);		// alt-func 0
	}
	else if(mode == 5){ 
  		set_gpio(pin, 5);		// alt-func 1
  	}
	else if(mode == 6){
 		set_gpio(pin, 6);		// alt-func 2
  	}
	else if(mode == 7){ 
  		set_gpio(pin, 7);		// alt-func 3
  	}
	else if(mode == 3){
 		set_gpio(pin, 3);		// alt-func 4
  	}
  	else if(mode == 2){ 
  		set_gpio(pin, 2);		// alt-func 5
	}	
	else{
		printf("%s() error: ", __func__);
  		puts("Invalid mode parameter.");
	}
}

/* Write a bit value to change the state of a GPIO output pin
 *
 * bit = 0 OFF state
 * bit = 1 ON  state
 */
uint8_t gpio_write(uint8_t pin, uint8_t bit) {
	volatile uint32_t *p = NULL;
	__sync_synchronize();

	if(bit == 1) {
		p = (uint32_t *)GPIO_GPSET0;
		*p = 1 << pin; 
	} 
	else if(bit == 0 ) {
		p = (uint32_t *)GPIO_GPCLR0;
		*p = 1 << pin;
	}
	else{
		printf("%s() error: ", __func__);
		puts("Invalid bit parameter");
	}

	__sync_synchronize();

	return bit; 
}

/* Turn ON a GPIO pin
 */
void gpio_on(uint8_t pin){
	gpio_write(pin, 1);
}

/* Turn OFF a GPIO pin
 */
void gpio_off(uint8_t pin){
	gpio_write(pin, 0);
}

/* Create a single-shot pulse
 *
 * td as time duration or period of the pulse 
 */
void gpio_pulse(uint8_t pin, uint32_t td){
	gpio_on(pin); 
	mswait(td);
	gpio_off(pin);  
}

/* Read the current state of a GPIO pin (input/output)
 *
 * return value
 * 0 (OFF state)
 * 1 (ON  state)
 */
uint8_t gpio_read(uint8_t pin) {
	return isBitSet(GPIO_GPLEV0, pin);
}

/* Remove all configured event detection from a GPIO pin */
void gpio_reset_all_events (uint8_t pin) {
	clearBit(GPIO_GPREN0, pin);
	mswait(1);
	clearBit(GPIO_GPFEN0, pin);
	mswait(1);
	clearBit(GPIO_GPHEN0, pin);
	mswait(1);
	clearBit(GPIO_GPLEN0, pin);
	mswait(1);
	clearBit(GPIO_GPAREN0, pin);
	mswait(1);
	clearBit(GPIO_GPAFEN0, pin);
	mswait(1);
	setBit(GPIO_GPEDS0, pin);
	mswait(1);
}

/**************************

   Level Detection Event

***************************/
/* Enable High Level Event from a GPIO pin 
 *
 * bit = 0 (event detection is disabled or OFF)
 * bit = 1 (event detection is enabled or ON)
 */
void gpio_enable_high_event (uint8_t pin, uint8_t bit) {
	if(bit == 1){
  		setBit(GPIO_GPHEN0, pin);
	}
	else if(bit == 0){
  		clearBit(GPIO_GPHEN0, pin);
	}
	else {
		printf("%s() error: ", __func__);
  		puts("Invalid bit parameter.");
	}
}

/* Enable Low Level Event from a GPIO pin
 *
 * bit = 0 (event detection is disabled or OFF)
 * bit = 1 (event detection is enabled or ON)
 */
void gpio_enable_low_event (uint8_t pin, uint8_t bit) {
	if(bit == 1){
  		setBit(GPIO_GPLEN0, pin);
	}
	else if(bit == 0){
  		clearBit(GPIO_GPLEN0, pin);
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
 * bit = 0 (event detection is disabled or OFF)
 * bit = 1 (event detection is enabled or ON)
 */
void gpio_enable_rising_event (uint8_t pin, uint8_t bit) {
	if(bit == 1){
		setBit(GPIO_GPREN0, pin);
	}
	else if(bit == 0){
		clearBit(GPIO_GPREN0, pin);
	}
	else {
		printf("%s() error: ", __func__);
		puts("Invalid bit parameter.");
	}
}

/* Enable Falling Event Detection
 *
 * bit = 0 (event detection is disabled or OFF)
 * bit = 1 (event detection is enabled or ON)
 */
void gpio_enable_falling_event (uint8_t pin, uint8_t bit) {
	if(bit == 1){
  		setBit(GPIO_GPFEN0, pin);
	}
	else if(bit == 0){
  		clearBit(GPIO_GPFEN0, pin);
	}
	else {
		printf("%s() error: ", __func__);
  		puts("Invalid bit parameter.");
	}
}

/* Enable Asynchronous Rising Event
 *
 * bit = 0 (event detection is disabled or OFF)
 * bit = 1 (event detection is enabled or ON)
 */
void gpio_enable_async_rising_event (uint8_t pin, uint8_t bit) {
	if(bit == 1){
  		setBit(GPIO_GPAREN0, pin);
	}
	else if(bit == 0){
  		clearBit(GPIO_GPAREN0, pin);
	}
	else {
		printf("%s() error: ", __func__);
    	puts("Invalid bit parameter.");
	}
}

/* Enable Asynchronous Falling Event
 *
 * bit = 0 (event detection is disabled or OFF)
 * bit = 1 (event detection is enabled or ON)
 */
void gpio_enable_async_falling_event (uint8_t pin, uint8_t bit) {
	if(bit == 1){
    	setBit(GPIO_GPAFEN0, pin);
	}
	else if(bit == 0){
  		clearBit(GPIO_GPAFEN0, pin);
	}
	else {
		printf("%s() error: ", __func__);
  		puts("Invalid bit parameter.");
	}
}

/* Detect an input event from a GPIO pin
 *
 * Note: The GPIO pin must be configured for any level or edge event detection.
 */
uint8_t gpio_detect_input_event(uint8_t pin) {
	return isBitSet(GPIO_GPEDS0, pin);
}

/* Reset input pin event when an event is detected
 *
 * from gpio_detect_input_event(pin)
 */  
void gpio_reset_event(uint8_t pin) {
  	setBit(GPIO_GPEDS0, pin);
}

/* Enable internal PULL-UP/PULL-DOWN resistor for gpio pins
 *
 * rpi 4
 * BCM2711 GPIO_GPPUPPDN0, GPIO_GPPUPPDN1, GPIO_GPPUPPDN2, GPIO_GPPUPPDN3
 *
 * value = 0, 0x0 or 00b, // Disable pull-up/down
 * value = 1, 0x1 or 01b, // Enable pull-up 		
 * value = 2, 0x2 or 10b, // Enable pull-down 	

 * pi zero, rpi3 and others
 * BCM2835 GPIO_GPPUD
 *
 * value = 0, 0x0 or 00b, // Disable pull-up/down
 * value = 1, 0x1 or 01b, // Enable pull-down 		
 * value = 2, 0x2 or 10b, // Enable pull-up 		
 */
void gpio_set_pud(uint8_t pin, uint8_t pud) {
    if(cpu_type == 4){
        uint32_t pull = 0x0;
        uint32_t lsb = (pin & 0xf) << 1; 

		if(pud == 0){       
 			pull = 0x0;		// No pull-up/down resistor is selected
	  	}
		else if(pud == 1){  
  			pull = 0x2;		// Pull-down is selected
		}
		else if(pud == 2){ 
			pull = 0x1;		// Pull-up is selected
	  	}
	  	else{
			printf("%s() error: ", __func__);
			puts("Invalid pull select pud.");
	  	}

        *(GPIO_GPPUPPDN0 + (pin >> 4)) = (*(GPIO_GPPUPPDN0 + (pin >> 4)) & ~(3 << lsb)) | (pull << lsb);
    }
	else{
		if(pud == 0){       
	  		*GPIO_GPPUD = 0x0;	// No pull-up/down resistor is selected
	  	}
		else if(pud == 1){  
            *GPIO_GPPUD = 0x1;	// Pull-down is selected
		}
		else if(pud == 2){ 
	  		*GPIO_GPPUD = 0x2;	// Pull-up is selected
	  	}
	  	else{
			printf("%s() error: ", __func__);
			puts("Invalid pull select pud.");
	  	}

		uswait(10);
		setBit(GPIO_GPPUDCLK0, pin);

		uswait(10); 
		*GPIO_GPPUD = 0x0;

        uswait(10);
		clearBit(GPIO_GPPUDCLK0, pin);
	}
}

uint8_t gpio_get_pud(uint8_t pin) {
    uint8_t pull_state = -1;
    
    if(cpu_type == 4){
        volatile uint32_t *addr = GPIO_GPPUPPDN0 + (pin >> 4);
        pull_state = (*addr) >> ((pin & 0xf) << 1) & 0x3;
    }
    
    return pull_state;
}

/***************************

	PWM Setup functions

****************************/
/* Reset all PWM pins to GPIO input */
void pwm_reset_all_pins(){
	gpio_input(18); // GPIO 18/PHY pin 12, channel 1
	mswait(1);
	gpio_input(13); // GPIO 13/PHY pin 33, channel 2
	mswait(1);
	gpio_input(12); // GPIO 12/PHY pin 32, channel 1
	mswait(1);
	gpio_input(19); // GPIO 19/PHY pin 35, channel 2
} 

/* Set a GPIO pin to its ALT-Func for PWM */
void pwm_set_pin(uint8_t pin){
  	if(pin == 12 || pin == 13) {    // alt 100b, PHY pin 33, GPIO 13, alt 0 
  		set_gpio(pin, 4);			// alt 100b, PHY pin 32, GPIO 12, alt 0
  	}
  	else if(pin == 18 || pin == 19) { // alt 10b, PHY pin 35, GPIO 19, alt 5 	
   		set_gpio(pin, 2);			  // alt 10b, PHY pin 12, GPIO 18, alt 5
 	}
  	else {
   		printf("%s() error: ", __func__);
		puts("Invalid pin number for PWM.");
		puts("Choose only from the board header pins 12, 32, 33 and 35.");
		exit(1);
  	}
}

/* Reset a PWM pin back to GPIO Input */
void pwm_reset_pin(uint8_t pin){
	if(pin == 18 || pin == 12 || pin== 13 || pin== 19) {     
  		gpio_input(pin);	// GPIO18/PHY12, GPIO12/PHY32, GPIO13/PHY33, GPIO19/PHY35
        gpio_set_pud(pin, 0);
  	}
  	else {
   		printf("%s() error: ", __func__);
		puts("Invalid pin.");
  		exit(1);
  	}
}

/*************************************

	PWM Clock operation functions

**************************************/
/* clock source constants */
#define OSC	0x1
#define PLLD 0x6

/* A quick check which clock generator is running
 * (field name: SRC (bit 0 to 3) of CM_GP2CTL register)
 */
uint8_t get_clk_src(){
	/* mask for clk SRC value 4 bits (0 to 3 bit position)*/
	uint32_t mask = 0x0000000F;
	/* return clk SRC value w/ barrier */
	return *CM_PWMCTL & mask;  // 0x1 for 19.2 MHz oscillator or 0x6 for PLLD 5000 MHz
}

/* A quick check if clock generator is running
 * (field name: BUSY (bit 7) of CM_GP2CTL register)
 */
uint8_t clk_status(){
	if(isBitSet(CM_PWMCTL, 7)){
  		return 1; // clk is running
  	}
	else{
  		return 0; // clk is not running
  	}
}

/* Calculate clock freq based on div (divisor) value */
void set_clock_div(uint32_t div){
	// using 5A as clock manager password for PASSWD field on bit num 31-21

	/* disable PWM while performing clk operations */
	clearBit(PWM_CTL, 0);
	clearBit(PWM_CTL, 8);

	uswait(10);

	/* check clk SRC and disable it temporarily */
	if(get_clk_src() == OSC){
		*CM_PWMCTL = 0x5A000001;  // stop the 19.2 MHz oscillator clock
	}
	else if(get_clk_src() == PLLD) {
		*CM_PWMCTL = 0x5A000006;  // stop the PLLD clock
	}

	uswait(20);

	/* forced reset if clk is still running */
	if(isBitSet(CM_PWMCTL, 7)){
		*CM_PWMCTL = 0x5A000020;  // kill the clock
		uswait(100);
	}
	
    /* set DIVF (bit num 11-0) divisor from clock manager 
	 * general purpose register (CM_GP2DIV) while clk is not running
  	 */
	if(!isBitSet(CM_PWMCTL, 7)){
		*CM_PWMDIV = 0x5A000000 | ( div << 12 );
	}
 
	uswait(20); 
}

/* Set clock frequency using a divisor value */
uint8_t pwm_set_clock_freq(uint32_t divider) {
	//if( 0 < divider && divider < 4096){
    if(divider > 0 && divider < 4096){
		set_clock_div(divider);
	}
	else {
		printf("%s() error: ", __func__);
		puts("Invalid divider argument value.");
		exit(1);
	} 
	
	/* set clock source to 19.2 MHz oscillator and enable it */   
	*CM_PWMCTL = 0x5A000011;
	
	uswait(10);
	
	if(get_clk_src() == OSC){
		return OSC;
	}
	else{
	 	return -1;
  	}
}

/*******************************

	PWM Operation functions

********************************/
void pwm_init(){
    if(rpi_init_access == 0){
    	gpio_init();  // map gpio for alt pin sel
    	set_each_peri_mmap(1); // map pwm peripheral register
	}

    mswait(5);

	if(debug) printf("PWM_PERI_BASE: %lu\n", (unsigned long)PWM_PERI_BASE);

	__sync_synchronize(); 
	if (PWM_PERI_BASE == 0){ 
		printf("%s() error: ", __func__);
		puts("Invalid memory-mapped PWM peripheral base register");
  		exit(1);
	}
}

/* Monitor PWM status register and reset accordingly
 * (Internal use only)
 */
void reset_status_reg(){
	bool STA2 = isBitSet(PWM_STA, 10);
	uswait(10); 
	bool STA1 = isBitSet(PWM_STA, 9);
	uswait(10); 
	bool BERR = isBitSet(PWM_STA, 8);
	uswait(10); 
	bool RERR1 = isBitSet(PWM_STA, 3);
	uswait(10); 
	bool WERR1 = isBitSet(PWM_STA, 2);
  	uswait(10);
 
	if(!STA1) {
		if(RERR1)
	 		setBit(PWM_STA, 3); // reset RERR1
	 	if(WERR1)
			setBit(PWM_STA, 2); // reset WERR1
	 	if(BERR)
	 		setBit(PWM_STA, 8); // reset BERR
	}
	if(!STA2){
		if(RERR1)
	  		setBit(PWM_STA, 3); // reset RERR1
	  	if(WERR1)
	  		setBit(PWM_STA, 2); // reset WERR1
	  	if(BERR)
	  		setBit(PWM_STA, 8); // reset BERR
	}
  	uswait(10);   
}

/* Set and Clear bits based on Field Name (or Bit position)
 * (Internal PWM Control Register utility function)
 */
void pwm_reg_ctrl(uint8_t n, uint8_t position){
	if(n == 1){
  		setBit(PWM_CTL, position);
  	}
  	else if(n == 0) {
  		clearBit(PWM_CTL, position);
  	}
  	else{
  		puts("Invalid n control parameter. Choose 1 or 0 only.");
  	}
  	uswait(10); 
}

/* Enable/Disable PWM
 *
 * n = 0 (Disable)
 * n = 1 (Enable)
 */
void pwm_enable(uint8_t pin, uint8_t n){
	// Channel 1
	if( pin == 18 || pin == 12) {    // GPIO 18/12, PHY 12/32     
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

/* Enable PWM or M/S (mark/space)
 *
 * n = 0 (Enable PWM)
 * n = 1 (Enable M/S)
 */
void pwm_set_mode(uint8_t pin, uint8_t n){
	// Channel 1
	if( pin == 18 || pin == 12) {	    // GPIO 18/12, PHY 12/32     
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

/* PWM output Reverse Polarity  (duty cycle inversion)
 *
 * n = 0 (Normal)
 * n = 1 (Reverse)
 */
void pwm_set_pola(uint8_t pin, uint8_t n){
	// Channel 1
	if( pin == 18 || pin == 12) {	    // GPIO 18/12, PHY 12/32     
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

/* Sets PWM range data or 'period T' of the pulse */
void pwm_set_range(uint8_t pin, uint32_t range){
	// Channel 1
	if( pin == 18 || pin == 12) {	    // GPIO 18/12, PHY 12/32     
		*PWM_RNG1 = range;
		reset_status_reg();
	}
	// Channel 2
	else if(pin == 13 || pin == 19) { // GPIO 13/19, PHY 33/35
		*PWM_RNG2 = range;
		reset_status_reg();
	}
	else{
		printf("%s() error: ", __func__);
		puts("Invalid pin.");
	}
}

/* Sets PWM data or 'pulse width' of the pulse to generate */
void pwm_set_data(uint8_t pin, uint32_t data){
  	// Channel 1
  	if( pin == 18 || pin == 12) {		// GPIO 18/12, PHY 12/32 
   		*PWM_DAT1 = data;
		reset_status_reg();
	}
  	// Channel 2
  	else if(pin == 13 || pin == 19) {	// GPIO 13/19, PHY 33/35
  		*PWM_DAT2 = data;
  		reset_status_reg();
  	}
  	else{
		printf("%s() error: ", __func__);
		puts("Invalid pin.");
  	}
}

/****************************************

	Helper functions for I2C and SPI

 ****************************************/
/* Clear FIFO buffer function for I2C and SPI operation */
void clear_fifo(volatile uint32_t* reg){
	setBit(reg, 4); // Set bit 4 of CLEAR field
	setBit(reg, 5); // Set bit 5 of CLEAR field
}

/*******************

	I2C Functons

********************/
// Write cycles place data into the 16-byte FIFO ready for BSC bus transmission (sends data to FIFO)
// Read cycles access data received from the BSC bus (read data from FIFO).

uint8_t i2c_pin_set = 1;

/* Reset all status register error bits */
void i2c_reset_error_status(){
	setBit(I2C_S, 9); // set CLKT field bit
	setBit(I2C_S, 8); // set ERR field bit
	setBit(I2C_S, 1); // set DONE field bit
}
/* Start I2C operation immediately w/o calling rpi_init(1)
 * (Initialization process is integrated with the function) 
 *
 * Choose the set of pins (SDA/SCL) to use
 *
 * value 1 (GPIO 02/pin 03 SDA1, GPIO 03/pin 05 SCL1)
 * value 0 (GPIO 00/pin 27 SDA0, GPIO 01/pin 28 SCL0)
 */
void i2c_start(uint8_t sel) {
    if(rpi_init_access == 0){
    	gpio_init();  // init gpio for alt pin sel
    	set_each_peri_mmap(3); // init i2c
	}

	mswait(5);
	
    if(debug){
	    printf("I2C_PERI_BASE: %lu\n", (unsigned long)I2C_PERI_BASE);
	    //printf("I2C_PERI_BASE2: %lu\n", (unsigned long)I2C_PERI_BASE2);
	    printf("base_pointer[6]: %lu\n", (unsigned long)base_pointer[6]);
	}

    if (I2C_PERI_BASE == 0){
		printf("%s() error: ", __func__);
		puts("Invalid memory-mapped I2C peripheral base register");
		exit(1);
	}

	mswait(5);

	// BSC0_BASE, using SDA0 (GPIO 00/pin 27) and SCL0 (GPIO 01/pin 28) 
	if(sel == 0){
        i2c_pin_set = 0;
		set_gpio(0, 4);	// GPIO 00 alt 100b, alt 0 SDA0 
		set_gpio(1, 4);	// GPIO 01 alt 100b, alt 0 SCL0  
    }
	// BSC1_BASE, using SDA1 (GPIO 02/pin 03) and SCL1 (GPIO 03/pin 05) 
	else if(sel == 1){
        i2c_pin_set = 1;
		set_gpio(2, 4);	// GPIO 02 alt 100b, alt 0 SDA1 
		set_gpio(3, 4);	// GPIO 03 alt 100b, alt 0 SCL1 
	}

	mswait(5);

	setBit(I2C_C, 15); // set I2CEN field,  enable I2C operation  (BSC controller is enabled)
	// or
	//*I2C_C |= 0x00008000;
}

/* Set falling and rising clock delay
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
 */
uint32_t set_clock_delay(uint8_t FEDL, uint8_t REDL){

	volatile uint32_t cdiv = *I2C_DIV;
	volatile uint8_t msb = FEDL;
	volatile uint8_t lsb = REDL;

	// reset data delay register msb and lsb using 0x0030 reset value
	*I2C_DEL = (volatile uint32_t)(0x0030 << 16 | 0x0030);

  	// set a new msb and lsb values to data delay register
	volatile uint32_t value = (volatile uint32_t)(msb << 16 | lsb);

	if((FEDL < (cdiv/2)) && (REDL < (cdiv/2))){
		*I2C_DEL = value;
	}
	else{
		puts("i2c_set_clock_freq() error: Clock delay is higher than cdiv/2.");
		return 1; 	
	}

	return *I2C_DEL;
}

/* Set clock frequency for data transfer using a divisor value */
void i2c_set_clock_freq(uint16_t divider)
{
	volatile uint32_t div_reg = *I2C_DIV;
	volatile uint32_t msb = div_reg & 0xFFFF0000;
	volatile uint32_t lsb = div_reg & 0x0000FFFF;

	volatile uint32_t *div = I2C_DIV;

  	lsb = 0x05DC;

	*div = (volatile uint32_t)(msb << 16 | lsb);

	*div = divider;

	set_clock_delay(1, 1);
}

/* Set data transfer speed from a baud rate(bits per second) value */
void i2c_data_transfer_speed(uint32_t baud)
{
	/* get the divisor value from the 250 MHz system clock source */
	//uint32_t divider = (CORE_CLK_FREQ/baud); 
    uint32_t divider = (core_clock_freq/baud); 		


	i2c_set_clock_freq((uint16_t)divider);
}

uint8_t i2c_rw_error(uint8_t i, uint8_t buf_len){

	uint8_t result = 0;

	if(i < buf_len)
	{
		result = 4;
		printf("%s(): ", __func__);
    	if(debug) puts("Data tansfer is incomplete.");
	}
	else if(i > buf_len)
	{
		result = 4;
		printf("%s(): ", __func__);
    	if(debug) puts("Data tansfer error.");
	}

	/* ERROR_NACK, slave addrress not acknowledge */
	if(isBitSet(I2C_S, 8))
	{
		result = 1;
		printf("%s(): ", __func__);
    	if(debug) puts("Slave address is not acknowledged.");
	}

	/* ERROR_CLKT, clock stretch timeout */
	else if(isBitSet(I2C_S, 9))
	{
		result = 2;
		printf("%s(): ", __func__); 
    	puts("Clock stretch timeout.");
	}
	/* write error
	 * Check if FIFO is empty and all data is sent to FIFO
	 * On write transfer, check TXE field, 0 = FIFO is not empty, 1 = FIFO is empty
	 */
	else if (!isBitSet(I2C_C, 0) && !isBitSet(I2C_S, 6))
	{
		if(debug) puts("The i2c controller did not send all the data to slave device.");
		result = 4;
		printf("%s(): ", __func__);
		if(debug) puts("Not all data were sent to the slave device.");
	}
	/* read error
	 * Check if FIFO is empty after reading sufficient data from FIFO
	 * On read transfer, check RXD field, 0 = FIFO is empty, 1 = FIFO is not empty
	 */
	else if (isBitSet(I2C_C, 0) && isBitSet(I2C_S, 5))
	{
		if(debug) puts("The i2c controller did not receive all the data from slave device.");
		result = 4;
		printf("%s(): ", __func__); 
 		if(debug) puts("Not all data were received from the slave device.");
	}

	/* check DONE and TA fields
	 * if DONE = 1 transfer is completed 
	 * if TA = 0 transfer is not active
	 */
	if(isBitSet(I2C_S, 1) && !isBitSet(I2C_S, 0))
	{
		setBit(I2C_S, 1); // reset DONE field = 1, data transfer is completed
	}
	else
	{
		result = 4;
    	printf("%s(): ", __func__);
    	if(debug) puts("Data transfer is incomplete.");
	}

	return result;
}

/* Slave device address write test, internal use only */
uint8_t i2c_slave_write_test(const char* wbuf, uint8_t wbuf_len)
{
	volatile uint32_t *dlen  = I2C_DLEN;
	volatile uint32_t *fifo  = I2C_FIFO;

	uint8_t i = 0;

	/* Empty fifo buffer from previous write cycle transaction */ 
	clear_fifo(I2C_C);

	/* Clear all errors from previous transaction */
	i2c_reset_error_status();

	*dlen = wbuf_len;	// sets the max. no of bytes for FIFO write cycle

	clearBit(I2C_C, 0); 	// clear READ field to initiate a write packet transfer
	setBit(I2C_C, 7);   	// set ST field to start the data transfer

	/* Check i2c status register during a write transfer */
	while(!isBitSet(I2C_S, 1))  // if DONE field = 1, data transfer is complete
	{
		while(isBitSet(I2C_S, 2) && (i <= wbuf_len))
		{
			*fifo = wbuf[i];
			i++;
		}
	}

	return i2c_rw_error(i, wbuf_len);
}

/* Get slave device address */
void i2c_select_slave(uint8_t addr)
{
	volatile uint32_t *a = I2C_A; 
	*a = addr;

	char buf[2] = { 0x01 };

	/* check slave address write error */
	if(i2c_slave_write_test(buf, 1) > 0){
		puts("Please check slave device address or slave pin connection.");
	}
}

/* Write a number of bytes into a slave device */
uint8_t i2c_write(const char* wbuf, uint8_t wbuf_len)
{
	volatile uint32_t *dlen	= I2C_DLEN;
	volatile uint32_t *fifo	= I2C_FIFO;

	uint8_t i = 0;

	/* Empty fifo buffer from previous write cycle transaction */ 
	clear_fifo(I2C_C);

	/* Clear all errors from previous transaction */
	i2c_reset_error_status();

	*dlen = wbuf_len; // sets the max. no of bytes for FIFO write cycle

	if( wbuf_len > 16){
		printf("%s() warning: ", __func__); 
		puts("Maximum number of bytes per one write cycle is 16 bytes, beyond this data will be ignored.");
		wbuf_len = 16;
	}

	/* Start a write transfer */
	clearBit(I2C_C, 0); // clear READ field to initiate a write packet transfer
	setBit(I2C_C, 7);   // set ST field to start the write transfer

	while(!isBitSet(I2C_S, 1)) // if DONE field = 1, data transfer is complete
	{
		// TXW = 0 FIFO is at least ¼ full and a write is underway
		// TXW = 1 FIFO is less than ¼ full and a write is underway
		while(isBitSet(I2C_S, 2) && (i <= wbuf_len))
		{
			*fifo = wbuf[i];
			i++;
		}
	}

	return i2c_rw_error(i, wbuf_len);
}

/* Read a number of bytes from a slave device */
uint8_t i2c_read(char* rbuf, uint8_t rbuf_len)
{
	volatile uint32_t *dlen = I2C_DLEN; 
	volatile uint32_t *fifo = I2C_FIFO;

	uint8_t i = 0;

	clear_fifo(I2C_C);
	i2c_reset_error_status();

	*dlen = rbuf_len;  

	/* Start a read transfer */
	setBit(I2C_C, 0); // set READ field to initiate a read packet transfer
	setBit(I2C_C, 7); // set ST field to start the read transfer

	//equivalent operation
	//*I2C_C |= 0x00000081;

	while(!isBitSet(I2C_S, 1))  // if DONE field = 1, data transfer is complete
	{
    	while(isBitSet(I2C_S, 5) && (rbuf_len >= i )) // check RXD field (RXD = 0 FIFO is empty, RXD = 1 FIFO contains at least 1 byte of data)
		{
    		rbuf[i] = *fifo;
    		i++;
		}
	}

	return i2c_rw_error(i, rbuf_len);
}

/* Read one byte of data from a slave device */
uint8_t i2c_byte_read(void){

	volatile uint32_t *dlen = I2C_DLEN;
	volatile uint32_t *fifo = I2C_FIFO;

	uint8_t i = 0;

	/* Empty fifo buffer from previous write cycle transactions */ 
	clear_fifo(I2C_C);

	/* Clear all errors from previous transactions */
	i2c_reset_error_status();

	/* Start read */
	setBit(I2C_C, 0); // set READ field, initiate a read packet data transfer
	setBit(I2C_C, 7); // set ST field, start the data transfer

	/* Set Data Length */
	*dlen = 1; // one byte only   

	uint8_t data = 0;

	/* keep reading data from fifo until Status Register field DONE bit = 1 */
	while(!isBitSet(I2C_S, 1))  // 0 = Transfer not completed. 1 = Transfer completed. Cleared by writing 1 to the field 
	{
		/* keep reading data from FIFO register */
		while(isBitSet(I2C_S, 5)) // Status Register RXD bit, 0 = fifo is empty, 1 = still has data
		{
			data = *fifo;
		}
	}

	i2c_rw_error(i, 1);

	return data;
}

/* Stop I2C operation, reset pin as input */
void i2c_stop() {

	clear_fifo(I2C_C);

	i2c_reset_error_status();

	clearBit(I2C_C, 15);

	if(i2c_pin_set == 0){
		set_gpio(0, 0);	/* alt 00b, PHY 27, GPIO 00, alt 0 	SDA */
		set_gpio(1, 0); /* alt 00b, PHY 28, GPIO 01, alt 0 	SCL */
	}
	else{
		set_gpio(2, 0);	/* alt 00b, PHY 3, GPIO 02, alt 0 	SDA */
		set_gpio(3, 0); /* alt 00b, PHY 5, GPIO 03, alt 0 	SCL */
  	}
}

/********************

	SPI Functons

*********************/
/* Start SPI operation */
void spi_start() {
    if(rpi_init_access == 0){
    	gpio_init();  // map gpio for alt pin sel
    	set_each_peri_mmap(2); // map spi peripheral register
  	}

    mswait(5);

    if(debug) printf("SPI_PERI_BASE: %lu\n", (unsigned long)SPI_PERI_BASE);

	__sync_synchronize(); 
    if (SPI_PERI_BASE == 0){
		printf("%s() error: ", __func__);
        puts("Invalid memory-mapped SPI peripheral base register");
  		exit(1);
	}

	set_gpio(8,  4);  // PHY 24, GPIO 8,  using value 100 , set to alt 0    CE0
	set_gpio(7,  4);  // PHY 26, GPIO 7,  using value 100 , set to alt 0	CE1
	set_gpio(10, 4);  // PHY 19, GPIO 10, using value 100 , set to alt 0    MOSI
	set_gpio(9,  4);  // PHY 21, GPIO 9,  using value 100 , set to alt 0 	MISO
	set_gpio(11, 4);  // PHY 23, GPIO 11, using value 100 , set to alt 0	SCLK

	mswait(5);

	clearBit(SPI_CS, 13); 	// set SPI to SPI Master (Standard SPI)
	clear_fifo(SPI_CS); 	  // Clear SPI TX and RX FIFO 
}

/* Stop SPI operation */
void spi_stop() {

	clear_fifo(SPI_CS);	  // Clear SPI TX and RX FIFO 

	set_gpio(8,  0);  // PHY 24, GPIO 8,  using value 0 , set to input  CE0
	set_gpio(7,  0);  // PHY 26, GPIO 7,  using value 0 , set to input  CE1
	set_gpio(10, 0);  // PHY 19, GPIO 10, using value 0 , set to input  MOSI
	set_gpio(9,  0);  // PHY 21, GPIO 9,  using value 0 , set to input  MISO
	set_gpio(11, 0);  // PHY 23, GPIO 11, using value 0 , set to input  SCLK
}

/* Set SPI clock frequency */
void spi_set_clock_freq(uint16_t divider){

	volatile uint32_t *div = SPI_CLK;
 	*div = divider;
}

/* Set SPI data mode
 *
 * SPI Mode0 = 0,  CPOL = 0, CPHA = 0
 * SPI Mode1 = 1,  CPOL = 0, CPHA = 1
 * SPI Mode2 = 2,  CPOL = 1, CPHA = 0
 * SPI Mode3 = 3,  CPOL = 1, CPHA = 1
 */
void spi_set_data_mode(uint8_t mode){
    
	if(mode == 0){
		clearBit(SPI_CS, 2); 		//CPHA 0
    	clearBit(SPI_CS, 3); 		//CPOL 0
	}
	else if(mode == 1){
		setBit(SPI_CS, 2);		  	//CPHA 1
    	clearBit(SPI_CS, 3);    	//CPOL 0
	}
	else if(mode == 2){		
		clearBit(SPI_CS, 2);		//CPHA 0
		setBit(SPI_CS, 3);		  	//CPOL 1
	}
	else if(mode == 3){
		clearBit(SPI_CS, 2);		//CPHA 1
		clearBit(SPI_CS, 3);		//CPOL 1
	}
  	else{
    	printf("%s() error: ", __func__);
    	puts("invalid mode");
  	}

  	// alternate code
  	/*
  	volatile uint32_t *cs = SPI_CS;
  	uint32_t mask = ~ (3 <<  2);	// clear bit position 2 and 3 first
  	*cs &= mask;	  		     	// set mask to 0
  	mask = (mode <<  2); 			// write mode value to set SPI data mode   
  	*cs |= mask; 	  				// set data mode
  	*/
}

/* SPI Chip Select
 *
 * 0  (00) = Chip select 0
 * 1  (01) = Chip select 1
 * 2  (10) = Chip select 2
 * 3  (11) = Reserved
 */
void spi_chip_select(uint8_t cs)
{
	volatile uint32_t *cs_addr = SPI_CS;

	uint32_t mask = ~ (3 <<  0);	// clear bit 0 and 1 first
	*cs_addr &= mask;	// set mask to value 0
	mask = (cs <<  0);	// write cs value to set SPI data mode   
	*cs_addr |= mask; 	// set cs value 
}

/* Set chip select polarity */
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

/* Writes and reads a number of bytes to/from a slave device */
void spi_data_transfer(char* wbuf, char* rbuf, uint8_t len)
{
	volatile uint32_t *fifo = SPI_FIFO;

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

/* Writes a number of bytes to SPI device */
void spi_write(char* wbuf, uint8_t wbuf_len)
{
	volatile uint32_t *fifo = SPI_FIFO;

	/* Clear TX and RX fifo's */
	clear_fifo(SPI_CS);

	/* start data transfer, set TA = 1 */
	setBit(SPI_CS, 7); 

	uint8_t i = 0;

	while (i < wbuf_len) 
	{
		// TX fifo is not full, add/write more bytes
		while(isBitSet(SPI_CS, 18) && (i < wbuf_len))
		{
	   		*fifo = wbuf[i];
	   		i++;
	 	}
	}
}

/* read a number of bytes from SPI device */
void spi_read(char* rbuf, uint8_t rbuf_len)
{
	volatile uint32_t *fifo = SPI_FIFO;

	if(!isBitSet(SPI_CS, 7)){
		printf("%s() error: ", __func__);
		puts("Nothing to read from fifo.");
		return;
	}

	/* continue data transfer from spi_write start transfer */
	//setBit(SPI_CS, 7); // currently no need to set to start data transfer

	uint8_t i = 0;

	while (i < rbuf_len) 
	{
		// TX fifo is not full, add/write more bytes
		while(isBitSet(SPI_CS, 17) && (i < rbuf_len))
		{
	   		rbuf[i] = *fifo;
	   		i++;
	 	}
	}

	/* Set TA = 0, transfer is done */
	clearBit(SPI_CS, 7);
}

