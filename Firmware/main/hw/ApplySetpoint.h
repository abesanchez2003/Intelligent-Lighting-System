#pragma once
#include "LED.h"
#include "LedSetpoint.h"

void applySetpoint(const LedSetpoint& sp, LED& warm, LED& cold);