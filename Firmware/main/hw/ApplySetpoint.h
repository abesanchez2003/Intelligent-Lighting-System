#pragma once
#include "LED.h"
#include "logic/LedSetpoint.h"

void applySetpoint(const LedSetPoint& sp, LED& warm, LED& cold);