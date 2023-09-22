#include "DHT.h"

DHT dht;
const int soil_pin = A1;   // A1 Soil Moisture
const int gas_pin = A0;    // A0 Gas
const int temp_pin = 4;    // D4 Temperature/Humidity

const int waterIn1 = 5;
const int waterIn2 = 6;
const int soilIn1 = 7;
const int soilIn2 = 8;

// Motor A (right side)
const int motor1Pin1 = 9; // Connect to IN1 of L298N
const int motor1Pin2 = 10; // Connect to IN2 of L298N

// Motor B (left side)
const int motor2Pin1 = 11; // Connect to IN3 of L298N
const int motor2Pin2 = 12; // Connect to IN4 of L298N


char cmd;

struct SensorData {
  float moisture;
  float temperature;
  float humidity;
  float gas;
};

void setup() {
  Serial.begin(9600);       // Baudrate for serial communication
  dht.setup(4);             // D4 for Temperature/Humidity sensor
  pinMode(waterIn1, OUTPUT);
  pinMode(waterIn2, OUTPUT);
  pinMode(soilIn1, OUTPUT);
  pinMode(soilIn2, OUTPUT);

  pinMode(motor1Pin1, OUTPUT);
  pinMode(motor1Pin2, OUTPUT);
  pinMode(motor2Pin1, OUTPUT);
  pinMode(motor2Pin2, OUTPUT);

  // Stop the motors initially
  digitalWrite(motor1Pin1, LOW);
  digitalWrite(motor1Pin2, LOW);
  digitalWrite(motor2Pin1, LOW);
  digitalWrite(motor2Pin2, LOW);

  Serial.println("Ready!");
}

void loop() {
  if (Serial.available()) {
    cmd = Serial.read();
    Serial.println("> " + String(cmd));

    switch (cmd) {
      case 'o':
        digitalWrite(waterIn1, HIGH);
        digitalWrite(waterIn2, LOW);
        Serial.println("Water pump turned ON");
        break;
      case 'f':
        digitalWrite(waterIn1, LOW);
        digitalWrite(waterIn2, LOW);
        Serial.println("Water pump turned OFF");
        break;
      case 'l':
        digitalWrite(soilIn1, LOW);
        digitalWrite(soilIn2, HIGH);
        Serial.println("Sensor has been inserted");
        delay(350);
        digitalWrite(soilIn1, LOW);
        digitalWrite(soilIn2, LOW);
        break;
      case 'u': 
        digitalWrite(soilIn1, HIGH);
        digitalWrite(soilIn2, LOW);
        Serial.println("Sensor has been raised");
        delay(450);
        digitalWrite(soilIn1, LOW);
        digitalWrite(soilIn2, LOW);
        break;
      case 'v':
        digitalWrite(soilIn1, LOW);
        digitalWrite(soilIn2, LOW);
        Serial.println("Soil sensor has been paused");
        break;
      case 'w': // Forward
        moveForward();
        break;
      case 's': // Backward
        moveBackward();
        break;
      case 'a': // Left (rotate left)
        rotateLeft();
        break;
      case 'd': // Right (rotate right)
        rotateRight();
        break;
      case 'z': // Stop
        stopMotors();
        break;
      default:
        break;
    }
  }

  SensorData data;
  data.humidity = dht.getHumidity();
  data.temperature = dht.getTemperature();
  data.moisture = analogRead(soil_pin);
  data.gas = analogRead(gas_pin);

  sendSensorData(data);
  delay(250);
}

void sendSensorData(const SensorData &data) {
  Serial.print("{");
  Serial.print("\"moisture\":");
  Serial.print(data.moisture);
  Serial.print(",");
  Serial.print("\"temperature\":");
  Serial.print(data.temperature);
  Serial.print(",");
  Serial.print("\"humidity\":");
  Serial.print(data.humidity);
  Serial.print(",");
  Serial.print("\"gas\":");
  Serial.print(data.gas);
  Serial.println("}");
}



void moveForward() {
  Serial.println("Moving forward");
  digitalWrite(motor1Pin1, HIGH);
  digitalWrite(motor1Pin2, LOW);
  digitalWrite(motor2Pin1, HIGH);
  digitalWrite(motor2Pin2, LOW);
}

void moveBackward() {
  Serial.println("Moving back");
  digitalWrite(motor1Pin1, LOW);
  digitalWrite(motor1Pin2, HIGH);
  digitalWrite(motor2Pin1, LOW);
  digitalWrite(motor2Pin2, HIGH);
}

void rotateLeft() {
  Serial.println("Moving left");
  digitalWrite(motor1Pin1, LOW);
  digitalWrite(motor1Pin2, HIGH);
  digitalWrite(motor2Pin1, HIGH);
  digitalWrite(motor2Pin2, LOW);
}

void rotateRight() {
  Serial.println("Moving right");
  digitalWrite(motor1Pin1, HIGH);
  digitalWrite(motor1Pin2, LOW);
  digitalWrite(motor2Pin1, LOW);
  digitalWrite(motor2Pin2, HIGH);
}

void stopMotors() {
  Serial.println("Stopping");
  digitalWrite(motor1Pin1, LOW);
  digitalWrite(motor1Pin2, LOW);
  digitalWrite(motor2Pin1, LOW);
  digitalWrite(motor2Pin2, LOW);
}