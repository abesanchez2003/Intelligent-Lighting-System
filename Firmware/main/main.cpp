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
#include "inputs.h"

extern "C" void app_main(void) {
    int SYSTEM_STATUS;
    //SYSTEM STATUS is 0 for MANUAL OPERATION
    // SYSTEM STATUS is 1 for SEMI-AUTOMATIC OPERATION
    // SYSTEM STATUS is 2 for AUTOMATIC OPERATION
    double cct;   
    LED warm(1,LEDC_CHANNEL_0);
    LED cold(2,LEDC_CHANNEL_2);
    static int prev_system_brightness_knob_voltage = -1;
    int ambient_light;
    SYSTEM_STATUS = 0;
    bool System_ON = true;
    InputManager inputs;
    inputs.init();


    while (true) 
    {
        vTaskDelay(100 / portTICK_PERIOD_MS);
        auto s = inputs.read();
        // ON/OFF toggle
        static bool prev_onoff = -1;
        bool curr_onoff = s.onoff_level;
        printf("GPIO%d level: %d\n", OnOff, gpio_get_level(OnOff)); 
        printf("GPIO%d level: %d\n", MOTION_SENSOR, gpio_get_level(MOTION_SENSOR));
        if(prev_onoff == -1){prev_onoff = curr_onoff;}
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
        if (s.mode_level) {
            SYSTEM_STATUS = (SYSTEM_STATUS + 1) % 3;
            printf("System Mode changed\n");
            printf("System Mode changed to: %d\n", SYSTEM_STATUS);

        }
        if(s.motion_level && !System_ON && SYSTEM_STATUS == 2)
        {
            System_ON = true;
        }
    
        if (System_ON) {
            switch (SYSTEM_STATUS) {
                // MANUAL MODE
                case 0: handleManual(warm, cold, s.brightness_raw, s.cct_raw,prev_system_brightness_knob_voltage); break;
                
                // SEMI-AUTOMATIC
                case 1: handleSemi(warm, cold, s.cct_raw,s.ambient_raw); break;

                // FULL AUTO
                case 2: handleAuto(warm, cold, s.ambient_raw, s.motion_level); break;
                
            }
        }
    
        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}
    
