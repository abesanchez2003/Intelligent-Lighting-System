#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include <vector>

#define LED_PIN GPIO_NUM_2  // ESP32 onboard LED

void app_main(void) {

    // Configure GPIO2 as output
    //gpio_reset_pin(LED_PIN);
    //gpio_set_direction(LED_PIN, GPIO_MODE_OUTPUT);

   /* 
   while (1) {
        gpio_set_level(LED_PIN, 1);  // Turn LED ON
        printf("LED ON\n");
        vTaskDelay(pdMS_TO_TICKS(1000));  // Delay 1 second

        gpio_set_level(LED_PIN, 0);  // Turn LED OFF
        printf("LED OFF\n");
        vTaskDelay(pdMS_TO_TICKS(1000));  // Delay 1 second
    }
        */
    volatile uint32_t *output = (volatile uint32_t *)(0x3FF44000 + 0x04);
    volatile uint32_t *enableoutput = (volatile uint32_t *)(0x3FF44000 + 0x20);
    

    while(1){
        *enableoutput = 1;
        *output = 1 << 0;

    }
    




}
