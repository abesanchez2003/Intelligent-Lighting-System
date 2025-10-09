#pragma once

#define LED_PIN GPIO_NUM_2  // ESP32 onboard LED
#define POT_RES GPIO_NUM_35
#define MODE_SELECT GPIO_NUM_17
#define MOTION_SENSOR GPIO_NUM_13
#define OnOff GPIO_NUM_8
#define TARGET_LUX 150
#define SDA_PIN GPIO_NUM_7
#define SCL_PIN GPIO_NUM_9
#define I2C_MASTER_SCL_IO CONFIG_I2C_MASTER_SCL               /*!< gpio number for I2C master clock */
#define I2C_MASTER_SDA_IO CONFIG_I2C_MASTER_SDA               /*!< gpio number for I2C master data  */
#define I2C_MASTER_NUM I2C_NUMBER(CONFIG_I2C_MASTER_PORT_NUM) /*!< I2C port number for master dev */
#define I2C_MASTER_FREQ_HZ CONFIG_I2C_MASTER_FREQUENCY        /*!< I2C master clock frequency */
#define I2C_MASTER_TX_BUF_DISABLE 0                           /*!< I2C master doesn't need buffer */
#define I2C_MASTER_RX_BUF_DISABLE 0      

#define DATA_LENGTH 512
#define I2C_SLAVE_SCL_IO SCL_PIN            /*!< gpio number for i2c slave clock */
#define I2C_SLAVE_SDA_IO SDA_PIN             /*!< gpio number for i2c slave data */
#define I2C_SLAVE_NUM I2C_NUMBER(CONFIG_I2C_SLAVE_PORT_NUM) /*!< I2C port number for slave dev */
#define I2C_SLAVE_TX_BUF_LEN (2 * DATA_LENGTH)              /*!< I2C slave tx buffer size */
#define I2C_SLAVE_RX_BUF_LEN (2 * DATA_LENGTH)              /*!< I2C slave rx buffer size */
#define VEML7700_ADDR 0x10