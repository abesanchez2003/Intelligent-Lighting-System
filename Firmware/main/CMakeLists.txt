file(GLOB_RECURSE SOURCES "*.cpp")

idf_component_register(
  SRCS
    main.cpp
    hw/inputs.cpp
    hw/ApplySetpoint.cpp
    hw/led.cpp            # <-- add this
    logic/setpoint/LedSetpoint.cpp
    policy/LightingController.cpp
    comms/wifi_client.cpp
    comms/mqtt_client_wrapper.cpp
  INCLUDE_DIRS
    .
    hw
    logic
    logic/setpoint
    policy
    comms
    tasks
  REQUIRES
    driver
    nvs_flash
    esp_wifi
    esp_event
    esp_netif
    esp_adc_cal
    mqtt
    freertos
)
