#include "mqtt_client.h"
#include <string>
enum topic_type{
    BRIGHTNESS_FETCH,
    TEMPERATURE_FETCH,
    AMBIENT_FETCH
};

struct topic_container{
    topic_type type;
    double value;
    bool retain;

};


class task_mqtt {
    void topic_container_handle(topic_container topic);


};