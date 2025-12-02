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
#include "Timeutils.h"

static EventGroupHandle_t s_wifi_event_group;
static const int GOT_IP_BIT = BIT0;
static bool        manual_inited = false;
static LedSetpoint last_manual_sp{};
constexpr int   B_DB  = 64;     // ~1.5% of 4095 (tune)
constexpr float R_DB  = 0.02f;  // 2% ratios

static inline bool nearlySameManual(const LedSetpoint& a, const LedSetpoint& b) {
    return (std::abs(a.brightness - b.brightness) < B_DB) &&
           (std::fabs(a.warm_ratio - b.warm_ratio) < R_DB) &&
           (std::fabs(a.cold_ratio - b.cold_ratio) < R_DB) &&
           (a.on == b.on);
}

static void on_got_ip(void*, esp_event_base_t base, int32_t id, void* data) {
    xEventGroupSetBits(s_wifi_event_group, GOT_IP_BIT);
}

extern "C" void app_main(void) {
    esp_log_level_set("*", ESP_LOG_INFO);
    //esp_log_level_set("*", ESP_LOG_DEBUG);

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
    float ambient_light;
    //SYSTEM_STATUS = 0;
    bool System_ON = true;
    InputManager inputs;
    inputs.init();
    Light_Controller controller(&warm,&cold);
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
    std:: string broker_url = "mqtts://lightingsys-f32f9e74.a02.usw2.aws.hivemq.cloud";
    Queues qs;
    qs.pub_q = outbound;
    qs.ctrl_q = inbound;
    mqtt.mqtt_start(broker_url, qs);
    control_task.start();

    printf("MAIN:   act=%p q=%p\n", &act, actuator_q);
    static bool last_on = true;
    LedSetpoint off_sp{false, 0, 0.5, 0.5};     // Whatever CCT you like when off
    // static bool last_on = true;                 // initialize to your power-on default
    // static LedSetpoint old_sp{true, 0, 0.5, 0.5}; // track last sent target
     inputs.motion_interrupt_init(controller_);
     inputs.mode_interrupt_init(controller_);
     inputs.onoff_interrupt_init(controller_);


    while (true) 
    {
        auto s = inputs.read();
        auto old_sample = s;
        shared_inputs = s;
        controller.step(s,millis());
        bool sys_on = controller.isSystemOn();
        bool prev_on_off = controller.isSystemOn();
        LedSetpoint sp;
        // --- Handle OFF state first, with edge detection ---
        if (!sys_on) {
            if (last_on) {
                // Falling edge: just once, send OFF target and cancel any transitions
                // (call any actuator method you have that cancels fades)
                // act.cancelTransitions(); // if available
                act.setTarget(off_sp);
                old_sp = off_sp;
                // printf("System turned OFF -> sent off_sp\n");
            }
            
        }
        last_on = sys_on;
        if(controller.isSystemOn()){
            switch (controller.getMode()){
                case  MANUAL:
                    sp = handleManual(s.brightness_raw,s.cct_raw,prev_system_brightness_knob_voltage);
                //     if (!manual_inited || !nearlySameManual(last_manual_sp, sp)) {
                //         manual_inited = true;
                //         last_manual_sp = sp;

                // // 2) If knob moved, see if we need to update hardware
                //         LedSetpoint current = act.getCurSetpoint();
                //         if (!nearlySameManual(current, sp)) {
                //             act.setTarget(sp);
                //         }
                //     }
                    break;
                case AUTO:
                    LedSetpoint cur = act.getCurSetpoint();
                //     sp = handleAuto(s.ambient_raw,controller.isSystemOn(),cur,cfg);
                //     printf("Current Target Lux: %f\n", cfg.target_lux);
                //     break;
                    
            }
                // LedSetpoint current = act.getCurSetpoint();
               
                
                if (!nearlySameSetpoint(old_sp,sp) && controller.getMode() == MANUAL) {
                act.setTarget(sp);
                old_sp = sp;
                }
                // if(controller.getMode() == AUTO){
                //     act.setTarget(sp);
                // }           
            
        }//else {
        //     sp = {false,0,0.5,0.5};
        //     //if (!nearlySameSetpoint(old_sp,sp)){
        //     //if(sp.on == false && old_sp.on == true){
        //     act.setTarget(sp);
        //     old_sp = sp;

            
                

            
            
        //     printf("Else branch triggered in main \n");
        // }
        //act.tick();

        //inputs.printInputSample(s);

        controller.printStatus();
        // printf("OnOff raw=%d\n", gpio_get_level(OnOff));
        // printf("[BOOT] OnOff GPIO number = %d\n", (int)OnOff);
        printf("LED WARM BRIGHTNESS: %d\n", warm.getBrightness());
        printf("LED COLD BRIGHTNESS: %d\n", cold.getBrightness());


        
    
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}
    
