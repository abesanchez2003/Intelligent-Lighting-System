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

static EventGroupHandle_t s_wifi_event_group;
static const int GOT_IP_BIT = BIT0;

static inline uint32_t millis() {
    // esp_timer_get_time() returns microseconds since boot
    return static_cast<uint32_t>(esp_timer_get_time() / 1000ULL);
}
static void on_got_ip(void*, esp_event_base_t base, int32_t id, void* data) {
    xEventGroupSetBits(s_wifi_event_group, GOT_IP_BIT);
}

extern "C" void app_main(void) {
    //esp_log_level_set("*", ESP_LOG_INFO);
    esp_log_level_set("*", ESP_LOG_DEBUG);
    // ESP_ERROR_CHECK(esp_wifi_set_storage(WIFI_STORAGE_RAM));
    // ESP_ERROR_CHECK(esp_wifi_restore());

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_t* sta = esp_netif_create_default_wifi_sta();
    assert(sta);

     s_wifi_event_group = xEventGroupCreate();
    ESP_ERROR_CHECK(esp_event_handler_instance_register(
        IP_EVENT, IP_EVENT_STA_GOT_IP, &on_got_ip, nullptr, nullptr));




    std::string ssid = "Iphone";
    std::string pwd = "tamu1523";
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        nvs_flash_erase();  // ⚠️ If NVS is corrupted, erase and re-init
        nvs_flash_init();
    }
    int a = connect_wifi(ssid,pwd);
    xEventGroupWaitBits(s_wifi_event_group, GOT_IP_BIT, pdTRUE, pdTRUE, portMAX_DELAY);


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

    // initiliaze change queue/mailbox
    QueueHandle_t actuator_q = xQueueCreate(1,sizeof(LedSetpoint));



     actuator act(actuator_q, &warm,&cold);
     act.start();
    //initiliaze mqtt
    QueueHandle_t outbound = xQueueCreate(16, sizeof(topic_container));
    QueueHandle_t inbound = xQueueCreate(16, sizeof(control_topic_structure));
    Light_Controller* controller_;
    controller_ = &controller;
    static InputSample shared_inputs = {};

      
    
    // publish task initilizing
    static task_mqtt producer(outbound, &shared_inputs, controller_);
    producer.start();

    //control task initializing
    static task_control control_task(inbound, controller_,&act, &cfg);

    mqtt_client mqtt;
    std:: string broker_url = "mqtts://esp-testing-770c93f8.a02.usw2.aws.hivemq.cloud";
    Queues qs;
    qs.pub_q = outbound;
    qs.ctrl_q = inbound;
    mqtt.mqtt_start(broker_url, qs);
    control_task.start();


    while (true) 
    {
        auto s = inputs.read();
        auto old_sample = s;
        shared_inputs = s;
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
                if(!isEqual(old_sp, sp)){
                   act.setTarget(sp);
                   old_sp = sp;
                }            
            
        } else {
            act.setTarget({false,0,0.5,0.5});
        }
        //act.tick();
    
        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}
    
