#include <stdio.h>
//#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include <vector>
#include <driver/ledc.h>
#include <cstring>
#include <nvs_flash.h>
#include "LED.h"
#include "modes.h"
#include "config.h"

double calc_system_temperature(LED warm, LED cold){
    // this function takes in warm and cold channel LED object and calculates the lighting system temperature

    double warm_bright_perc = (warm.getBrightness() / 8191.0) * 100.0;
    double cold_bright_perc = (cold.getBrightness() / 8191.0) * 100.0;
    double  cct = ( warm_bright_perc * 2700.0) + (cold_bright_perc * 6500);
    
    return cct;
}

extern "C" void app_main(void) {
    int SYSTEM_STATUS;

    //SYSTEM STATUS is 1 for MANUAL OPERATION
    // SYSTEM STATUS is 2 for SEMI-AUTOMATIC OPERATION
    // SYSTEM STATUS is 3 for AUTOMATIC OPERATION
    double cct;

    // Configure ADC1 capture width
    // 12 bit decimal value from 0 to 4095
    adc1_config_width(ADC_WIDTH_BIT_12); 
    // Configure the ADC1 channel (ADC1_CHANNEL_6 - pin 34), and setting attenuation (ADC_ATTEN_DB_11)
    adc1_channel_t brightnessknob = ADC1_CHANNEL_4;
    adc1_channel_t cct_knob = ADC1_CHANNEL_5;
    adc1_channel_t light_sensor = ADC1_CHANNEL_3;
    adc1_config_channel_atten(brightnessknob, ADC_ATTEN_DB_11);
    adc1_config_channel_atten(light_sensor,ADC_ATTEN_DB_11);
    adc1_config_channel_atten(cct_knob, ADC_ATTEN_DB_11);
    gpio_config_t onoff_conf = {
        .pin_bit_mask = (1ULL << OnOff),
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,  // already externally pulled up via R4
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    gpio_config(&onoff_conf);


    LED warm(1,LEDC_CHANNEL_0);
    LED cold(2,LEDC_CHANNEL_2);
    static int prev_system_brightness_knob_voltage = -1;
    int ambient_light;
    SYSTEM_STATUS = 0;
    bool System_ON = true;


    while (true) 
    {
        vTaskDelay(100 / portTICK_PERIOD_MS);
    
        // ON/OFF toggle
        static int prev_onoff = -1;
        int curr_onoff = gpio_get_level(OnOff);
        printf("GPIO%d level: %d\n", OnOff, gpio_get_level(OnOff)); 
        printf("GPIO%d level: %d\n", MOTION_SENSOR, gpio_get_level(MOTION_SENSOR));
        if(prev_onoff == -1){
            prev_onoff = curr_onoff;
        }
        if (curr_onoff == 0 && prev_onoff == 1) {
            System_ON = !System_ON;
            printf("System is now: %s\n", System_ON ? "ON" : "OFF");
            if (!System_ON) {
                warm.setState(false);
                cold.setState(false);
            }
            else
            {
                warm.setState(true);
                cold.setState(true);
            }
        }
        prev_onoff = curr_onoff;

    
        // Cycle system mode
        if (gpio_get_level(MODE_SELECT) == 0) {
            SYSTEM_STATUS = (SYSTEM_STATUS + 1) % 3;
            printf("System Mode changed\n");
            printf("System Mode changed to: %d\n", SYSTEM_STATUS);

        }
        if(gpio_get_level(MOTION_SENSOR) == 1 && !System_ON && SYSTEM_STATUS == 2)
        {
            System_ON = true;
        }
    
        if (System_ON) {
            switch (SYSTEM_STATUS) {
                // MANUAL MODE
                case 0: handleManual(warm, cold, brightnessknob, cct_knob,prev_system_brightness_knob_voltage); break;
                
                // SEMI-AUTOMATIC
                case 1: handleSemi(warm, cold, cct_knob,light_sensor); break;

                // FULL AUTO
                case 2: handleAuto(warm, cold, light_sensor); break;
                
            }
        }
    
        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}
    