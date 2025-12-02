// TimeUtils.hpp
#pragma once

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static inline uint32_t millis()
{
    return (uint32_t)(xTaskGetTickCount() * portTICK_PERIOD_MS);
}
