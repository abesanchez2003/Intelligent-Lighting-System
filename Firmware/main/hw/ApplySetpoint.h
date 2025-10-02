#pragma once
#include "LED.h"
#include "LedSetpoint.h"
#include "freertos/queue.h"



class actuator{
public: 
    actuator(Queuehandle_t queue, LED* warm, LED* cold): actuator_queue(queue), warm(warm), cold(cold) {};
    void setTarget(LedSetpoint sp);
    void applySetpoint(const LedSetpoint& sp);
    void tick();
    LedSetpoint getCurSetpoint();
    QueueHandle_t getQueue();
private: 
    QueueHandle_t actuator_queue;
    LED* warm;
    LED* cold;
    LedSetpoint curSetpoint;


};



