#pragma once
#include <string>
#include <esp_err.h>
#include <esp_log.h>
#include <esp_wifi.h> 
int connect_wifi(std:: string ssid, std:: string pwd); 
void testWifi();