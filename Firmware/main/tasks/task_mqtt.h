
#pragma once
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"   // if you use TaskHandle_t here
#include "freertos/queue.h"  // for QueueHandle_t
#include "mqtt_client_wrapper.h"
#include <string>
#include "inputs.h"
#include "LightingController.h"


enum topic_type{
    BRIGHTNESS_FETCH,
    TEMPERATURE_FETCH,
    AMBIENT_FETCH,
    MODE_FETCH,
    MOTION_FETCH
};

struct topic_container{
    topic_type type;
    double value;
    bool retain;

};


class task_mqtt {
public:
    explicit task_mqtt(QueueHandle_t pub_q, const InputSample* inputs, Light_Controller* controller): pub_q_(pub_q), inputs_(inputs), controller_(controller){};
    void start(const char* name = "task_mqtt",
               uint32_t stack_words = 4096,
               UBaseType_t prio = 5) {
        xTaskCreate(&task_mqtt::task_entry, name, stack_words, this, prio, nullptr);
    }


private:
    QueueHandle_t pub_q_;
    const InputSample* inputs_;
    Light_Controller* controller_;
    static void task_entry(void* pv) {
        static_cast<task_mqtt*>(pv)->run();
    }
    void run(){
        topic_container m;
        while(true){
            // pushing brightness, ambient, temp topic to queue 
            int cold_brightness = controller_->cold_ ->getBrightness();
            int warm_brightness = controller_ -> warm_ -> getBrightness();
            double brightness = (cold_brightness + warm_brightness) / 2.0;
            brightness = (brightness / 4095) * 100;
            double ambient = inputs_ -> ambient_raw;
            double temp = inputs_ -> cct_raw;
            double mode = 0;
            bool motion_latched = controller_->consume_motion_event();
            double motion = motion_latched ? 1.0 : 0.0;
            if(controller_ -> getMode() == AUTO){
                mode = 1;
            }
            m.retain = true;

            m.type = BRIGHTNESS_FETCH; m.value = brightness; xQueueSend(pub_q_,&m,portMAX_DELAY);
            m.type = AMBIENT_FETCH; m.value = ambient; xQueueSend(pub_q_, &m, portMAX_DELAY);
            m.type = TEMPERATURE_FETCH; m.value = temp; xQueueSend(pub_q_, &m, portMAX_DELAY);
            m.type = MODE_FETCH; m.value = mode; xQueueSend(pub_q_, &m, portMAX_DELAY);
            m.type = MOTION_FETCH; m.value = motion; xQueueSend(pub_q_, &m, portMAX_DELAY);
            vTaskDelay(pdMS_TO_TICKS(5000));

        }
    }    


};