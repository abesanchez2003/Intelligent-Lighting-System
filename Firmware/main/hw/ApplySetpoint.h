#pragma once
#include "LED.h"
#include "LedSetpoint.h"
#include "freertos/queue.h"

void applySetpoint(const LedSetpoint& sp, LED& warm, LED& cold);

class actuator{
    actuator(Queuehandle_t queue, )
private: 
    Queuehandle_t actuator_queue;
}