#include "ApplySetpoint.h"

void actuator:: setTarget(LedSetpoint sp){
     if (!actuator_queue) return;
    LedSetpoint tmp = sp;
    xQueueOverwrite(actuator_queue, &tmp);

}
void actuator::start(UBaseType_t prio, uint32_t stack, BaseType_t core) {
    xTaskCreatePinnedToCore(&actuator::taskEntry, "actuator_task",stack, this, prio, nullptr, core);
}

void actuator::taskEntry(void* arg) {
    static_cast<actuator*>(arg)->run();
    vTaskDelete(nullptr);
    }
void actuator::applySetpoint(const LedSetpoint& sp){
    static bool last_on = false;
    static int last_w = -1, last_c = -1;

    if (!sp.on) {
        if (last_on) { warm->setState(false); cold->setState(false); last_on=false; }
        return;
    }
    if (!last_on) { warm->setState(true); cold->setState(true); last_on=true; }

    int w = (int)(sp.brightness * sp.warm_ratio);
    int c = (int)(sp.brightness * sp.cold_ratio);
    auto changed = [](int a, int b){ return abs(a-b) > 20; }; // small deadband

    if (changed(w, last_w)) { warm->setBrightness(w); last_w = w; }
    if (changed(c, last_c)) { cold->setBrightness(c); last_c = c; }
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
    taskENTER_CRITICAL(nullptr);
    LedSetpoint copy = curSetpoint;
    taskEXIT_CRITICAL(nullptr);
    return copy;
}
void actuator::run() {
    LedSetpoint sp;
    for (;;) {
        if (xQueueReceive(actuator_queue, &sp, portMAX_DELAY)) {
            curSetpoint = sp; // snapshot for getters
            applySetpoint(sp);
        }
    }
}