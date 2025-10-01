#pragma once
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>
#include <inttypes.h>
#include <cstdio>
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "esp_netif.h"
#include <string>
#include "esp_log.h"
#include "mqtt_client.h"
#include "LedSetpoint.h"
#include "inputs.h"
#include "task_mqtt.h"
#include "freertos/queue.h"
#include "task_control.h"

struct Queues {
    QueueHandle_t pub_q;
    QueueHandle_t ctrl_q;
}

class mqtt_client {
private:
    esp_mqtt_client_handle_t client_ = nullptr;
    Queues queues_;
     static void publish_task_entry(void *pvParameters) {
        auto *ctx = static_cast<mqtt_client*>(pvParameters);
        ctx->mqtt_publish_task(); // call real member
    }
    int parse_int(char* data, int data_len);
    double parse_double(char* data, int data_len);
public:
    mqtt_client() : client_(nullptr), queues_(nullptr) {}
    static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data);
    void mqtt_start(const std:: string& broker_url, Queues queues );
    void mqtt_publish_task(void);
    void handle_ctrl_q(auto* event);
    control_topic_type map_topic(char* topic);

    
    
    
};