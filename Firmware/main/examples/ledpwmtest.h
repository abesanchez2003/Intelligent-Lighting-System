#ifndef LEDPWMTEST_H
#define LEDPWMTEST_H

#ifdef __cplusplus
extern "C" {
#endif

#include "driver/ledc.h"  // Ensures LEDC macros are available

#define LEDC_TIMER       LEDC_TIMER_0
#define LEDC_MODE        LEDC_LOW_SPEED_MODE
#define LEDC_OUTPUT_IO (0)
#define LEDC_CHANNEL     LEDC_CHANNEL_0
#define LEDC_DUTY_RES    LEDC_TIMER_13_BIT
#define LEDC_DUTY        (4096)  // 50% duty cycle for 13-bit resolution
#define LEDC_FREQUENCY   (4000)  // 4 kHz PWM frequency

void ledc_test();

#ifdef __cplusplus
}
#endif

#endif // LEDPWMTEST_H

