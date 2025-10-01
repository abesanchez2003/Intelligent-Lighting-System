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
#include "mqtt_client_wrapper.h"
#include "task_mqtt.h"
#include "task_control.h"


static inline uint32_t millis() {
    // esp_timer_get_time() returns microseconds since boot
    return static_cast<uint32_t>(esp_timer_get_time() / 1000ULL);
}

extern "C" void app_main(void) {
    //esp_log_level_set("*", ESP_LOG_INFO);
    esp_log_level_set("*", ESP_LOG_DEBUG);
    std::string ssid = "TAMU_IoT";
    std::string pwd = "";
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        nvs_flash_erase();  // ⚠️ If NVS is corrupted, erase and re-init
        nvs_flash_init();
    }
    int a = connect_wifi(ssid,pwd);

    //initiliaze mqtt
    QueueHandle_t outbound = xQueueCreate(16, sizeof(topic_container));
    QueueHandle_t inbound = xQueueCreate(16, sizeof(control_topic_structure));
    Light_Controller controller_;
    static InputSample shared_inputs = {};


    // publish task initilizing
    static task_mqtt producer(outbound, &shared_inputs);
    producer.start();

    //control task initializing
    static task_control control_task(inbound, controller_);

    mqtt_client mqtt;
    std:: string broker_url;
    mqtt.mqtt_start(broker_url, q);






    // initiliazing LEDs, LED controller, and inputs
    double cct;   
    LED warm(1,LEDC_CHANNEL_0);
    LED cold(2,LEDC_CHANNEL_2);
    AutoConfig cfg;
    static int prev_system_brightness_knob_voltage = -1;
    int ambient_light;
    //SYSTEM_STATUS = 0;
    bool System_ON = true;
    InputManager inputs;
    inputs.init();
    Light_Controller controller;
    LedSetpoint old_sp;



    while (true) 
    {
        auto s = inputs.read();
        auto old_sample = s;
        shared_inputs = s;
        controller_ = controller;
        controller.step(s,millis());
        if(controller.isSystemOn()){
            LedSetpoint sp;
            switch (controller.getMode()){
                case  MANUAL:
                    sp = handleManual(s.brightness_raw,s.cct_raw,prev_system_brightness_knob_voltage);
                    
                    break;
                case AUTO:
                    sp = handleAuto(s.ambient_raw,s.motion_level,cfg);
                    break;
                    
            }
                if(isEqual(old_sp, sp)){
                    continue;
                }
                else{
                    applySetpoint(sp,warm,cold);
                }
                old_sp = sp;            
            
        } else {
            applySetpoint({false,0,0.5,0.5},warm,cold);
        }
    
        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}
    
