const io = require('socket.io-client');


const serverUrl = 'http://localhost:3000';

const socket = io(serverUrl);

socket.on('connect', () => {
  console.log('Connected to the server');
  socket.emit('join', 'joined');
});


socket.on('data', (message) => {
  console.log(message);
});

socket.on('update', (data) => {
  if(data.includes("NAN")) data = data.replace("NAN", `0`).replace("NAN", `0`).replace("NAN", `0`)
  console.log(JSON.parse(data))
})