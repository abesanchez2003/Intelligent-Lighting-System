#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <stdio.h>
#include "esp_timer.h"
#include "driver/gpio.h"
#include <driver/ledc.h>
#include <cstring>
#include <nvs_flash.h>
#include "LED.h"
#include "config.h"
#include "inputs.h"
#include "policy/LightingController.h"
#include "logic/setpoint/LedSetpoint.h"
#include "hw/ApplySetpoint.h"
#include "esp_mac.h"
#include "esp_system.h"
#include "wifi_client.h"
#include <string>


static inline uint32_t millis() {
    // esp_timer_get_time() returns microseconds since boot
    return static_cast<uint32_t>(esp_timer_get_time() / 1000ULL);
}

extern "C" void app_main(void) {
    //esp_log_level_set("*", ESP_LOG_INFO);
    esp_log_level_set("*", ESP_LOG_DEBUG);
    uint8_t mac[6];
    esp_read_mac(mac, ESP_MAC_WIFI_STA);
    printf("STA MAC: %02X:%02X:%02X:%02X:%02X:%02X\n",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]); 
    std::string ssid = "TAMU_IoT";
    std::string pwd = "";
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        nvs_flash_erase();  // ⚠️ If NVS is corrupted, erase and re-init
        nvs_flash_init();
    }
    int a = connect_wifi(ssid,pwd);

    //MQTT setup 
    



    // initiliazing LEDs, LED controller, and inputs
    // double cct;   
    // LED warm(1,LEDC_CHANNEL_0);
    // LED cold(2,LEDC_CHANNEL_2);
    // AutoConfig cfg;
    // static int prev_system_brightness_knob_voltage = -1;
    // int ambient_light;
    // //SYSTEM_STATUS = 0;
    // bool System_ON = true;
    // InputManager inputs;
    // inputs.init();
    // Light_Controller controller;



    // while (true) 
    // {
    //     vTaskDelay(100 / portTICK_PERIOD_MS);
    //     auto s = inputs.read();
    //     controller.step(s,millis());
    //     if(controller.isSystemOn()){
    //         LedSetpoint sp;
    //         switch (controller.getMode()){
    //             case  MANUAL:
    //                 sp = handleManual(s.brightness_raw,s.cct_raw,prev_system_brightness_knob_voltage);
    //                 break;
    //             case AUTO:
    //                 sp = handleAuto(s.ambient_raw,s.motion_level,cfg);
    //                 break;
                    
                    
    //         }
    //         applySetpoint(sp,warm,cold);
    //     } else {
    //         applySetpoint({false,0,0.5,0.5},warm,cold);
    //     }
    
    //     vTaskDelay(100 / portTICK_PERIOD_MS);
    // }
}
    
