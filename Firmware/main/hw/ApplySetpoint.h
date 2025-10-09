#pragma once
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"   // if you use TaskHandle_t here
#include "freertos/queue.h"  // for QueueHandle_t
#include "LED.h"
#include "LedSetpoint.h"



class actuator{
public: 
    actuator(QueueHandle_t queue, LED* warm, LED* cold): actuator_queue(queue), warm(warm), cold(cold) {};
    void setTarget(LedSetpoint sp);
   
    //void tick();
    LedSetpoint getCurSetpoint();
    QueueHandle_t getQueue();
    void start(UBaseType_t prio = tskIDLE_PRIORITY + 1,
               uint32_t stack = 4096,
               BaseType_t core = tskNO_AFFINITY);
private: 
    QueueHandle_t actuator_queue;
    LED* warm;
    LED* cold;
    LedSetpoint curSetpoint;
    static void taskEntry(void* arg);
    void        run();
    void applySetpoint(const LedSetpoint& sp);


};



