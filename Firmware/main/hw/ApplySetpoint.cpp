#include "ApplySetpoint.h"

void actuator:: setTarget(LedSetpoint sp){
    if (!actuator_queue) { printf("actuator_queue NULL\n"); return; }
    //xQueueReset(actuator_queue);
    xQueueOverwrite(actuator_queue, &sp);
    printf("setTarget:: Queue item sent to back.");
    printf("setTarget: this=%p q=%p bri=%d wr=%.2f\n", this, actuator_queue, sp.brightness, sp.warm_ratio);

}
void actuator::start(UBaseType_t prio, uint32_t stack, BaseType_t core) {
    xTaskCreatePinnedToCore(&actuator::taskEntry, "actuator_task",stack, this, prio, nullptr, core);
}

void actuator::taskEntry(void* arg) {
    static_cast<actuator*>(arg)->run();
    vTaskDelete(nullptr);
    }
void actuator::applySetpoint(const LedSetpoint& sp)
{
    // If OFF: just shut both channels and bail.
    // if (!sp.on) {
    //     warm->setState(false);
    //     cold->setState(false);
    //     warm->setBrightness(0);
    //     cold->setBrightness(0);
    //     return;
    // }

    // Ensure drivers are enabled when ON.
    warm->setState(true);
    cold->setState(true);
    int w = (int)lroundf(sp.brightness * sp.warm_ratio);
    int c = sp.brightness - w;   // preserve total

    // Write immediately — no smoothing, no debouncing.
    warm->setBrightness(w);
    cold->setBrightness(c);
}


// void actuator:: tick(){
//     //LedSetpoint sp;

//     if (!actuator_queue) return;

//      if(actuator_queue != 0){
//         if(xQueueReceive(actuator_queue, &curSetpoint,pdMS_TO_TICKS(50))){
//             printf("Actuator Queue Item recieved parsing actuation\n");
//             applySetpoint(curSetpoint);

//         }
//     }
// }
QueueHandle_t actuator:: getQueue(){
    return actuator_queue;
}
LedSetpoint actuator:: getCurSetpoint(){
    //taskENTER_CRITICAL(nullptr);
    LedSetpoint copy = curSetpoint;
    //taskEXIT_CRITICAL(nullptr);
    return copy;
}
void actuator::run() {
    LedSetpoint sp;
    for (;;) {
        if (xQueueReceive(actuator_queue, &sp, portMAX_DELAY)) {
            printf("Actuator Queue Item recieved");
            printf("Actuator run: this=%p q=%p bri=%d wr=%.2f\n", this, actuator_queue, sp.brightness, sp.warm_ratio);
            curSetpoint = sp; // snapshot for getters
            printf("Actuator: on=%d bri=%d wr=%.2f cr=%.2f\n",sp.on, sp.brightness, sp.warm_ratio, sp.cold_ratio);
            applySetpoint(sp);
        }
    }
}