#include "ApplySetpoint.h"

void actuator:: setTarget(LedSetpoint sp){
    xQueueSend(actuator_queue,&sp,portMAX_DELAY);

}
void actuator:: applySetpoint(const LedSetpoint& sp){
    if(!sp.on){
        warm -> setState(false);
        cold -> setState(false);
        return;
    }
    warm -> setState(true);
    cold -> setState(true);
    warm -> setBrightness(static_cast<int>(sp.brightness * sp.warm_ratio));
    cold -> setBrightness(static_cast<int>(sp.brightness * sp.cold_ratio));
}
void actuator:: tick(){
    //LedSetpoint sp;
     if(actuator_queue != 0){
        if(xQueueReceive(actuator_queue, &curSetpoint,0)){
            printf("Actuator Queue Item recieved parsing actuation");
            applySetpoint(curSetpoint);

        }
    }
}
QueueHandle_t actuator:: getQueue(){
    return actuator_queue;
}
LedSetpoint actuator:: getCurSetpoint(){
    return curSetpoint;
}