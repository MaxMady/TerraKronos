const { SerialPort } = require('serialport')
const port = new SerialPort({ path: 'COM4', baudRate: 9600 })

port.open((err) => {
    if (err) {
      console.error('Error opening port:', err);
    } else {
      console.log(`Connected to ${portName}`);
  
      // Listen for data from the serial port
      port.on('data', (data) => {
        console.log(`Received data: ${data.toString()}`);
        // Do something with the received data
      });
  
      // Write data to the serial port
      const dataToSend = 'Hello, Arduino!';
      port.write(dataToSend, (err) => {
        if (err) {
          console.error('Error writing to port:', err);
        } else {
          console.log(`Sent data: ${dataToSend}`);
        }
      });
    }
  });