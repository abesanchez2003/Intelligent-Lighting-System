#pragma once
#include "LightingController.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "LedSetpoint.h"
#include "ApplySetpoint.h"

enum control_topic_type{
    BRIGHTNESS_CONTROL,
    TEMPERATURE_CONTROL,
    MODE_CONTROL,
    TARGET_LUX_CONTROL,
    OCCUPANCY_STATE
};

struct control_topic_structure {
    control_topic_type topic;
    union {
        int int_val;
        double double_val;
        bool  bool_val;
    } value;
    //char value [128];
};
// struct System_State {
//     Mode mode;
//     double brightness;
//     double cct;
//     double target_lux;
//     bool occupancy;


// };

class task_control{
public:
    task_control(QueueHandle_t ctrl_q, Light_Controller* controller, actuator* act, AutoConfig* cfg): controller_(controller), ctrl_q_(ctrl_q),act_(act), cfg_(cfg)  {};
    void start(const char* name = "task_control",
               uint32_t stack_words = 4096,
               UBaseType_t prio = 5) {
        xTaskCreate(&task_control::task_entry, name, stack_words, this, prio, nullptr);
    }

private:
    Light_Controller* controller_ ;
    QueueHandle_t ctrl_q_;
    actuator* act_;
    AutoConfig* cfg_;
    static void task_entry(void* pv) {
        static_cast<task_control*>(pv)->run();
    }
    void parse_command(control_topic_structure command){
        LedSetpoint sp = act_ -> getCurSetpoint();
        switch (command.topic)
        {
        case BRIGHTNESS_CONTROL:
            sp.brightness = command.value.int_val;
            act_ -> setTarget(sp);
            break;
        case TEMPERATURE_CONTROL:
            sp.warm_ratio = command.value.double_val;
            sp.cold_ratio = (1.0 - sp.warm_ratio);
            act_ -> setTarget(sp);
            break;
        case MODE_CONTROL:
            controller_ -> cycleMode();
            break;
        // will do other commands later just trying to get baseline
        case TARGET_LUX_CONTROL:
            cfg_-> target_lux = command.value.double_val;
            
            
        
        default:
            break;
        }

    }
    //int brightness

    void run(){
        while(true){
            control_topic_structure receive;
            if(ctrl_q_ != 0){
                if(xQueueReceive(ctrl_q_, &receive,portMAX_DELAY)){
                    printf("Queue Item recieved parsing command");
                    parse_command(receive);

                }
                else{
                    printf("Failed to recieve queue item");
                }

            }
        }

    }




};
