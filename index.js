const WebSocket = require('ws');
const fs = require('fs');
const axios = require('axios');

// WebSocket server URL (replace with your server's URL)
const serverUrl = 'ws://localhost:8765';
const imageUrlOrPath = `https://ag.umass.edu/sites/ag.umass.edu/files/fact-sheets/images/img_4007.jpg`
// Path to the image you want to classify (local file or URL)
const images = [
    'https://bpb-us-e1.wpmucdn.com/blogs.cornell.edu/dist/8/5755/files/2019/09/tomato-early-blight1x2400.jpg',
    'https://ag.umass.edu/sites/ag.umass.edu/files/fact-sheets/images/potyrala_cross_rd._2.jpg'
]
// Create a WebSocket connection
const ws = new WebSocket(serverUrl);

// Function to send image data to the WebSocket server
async function sendImageToServer(imageData) {
  try {
    // Send the image data as a binary message to the server
    ws.send(imageData);
  } catch (error) {
    console.error('Error sending image data:', error);
  }
}

// Handle WebSocket connection opened
ws.on('open', () => {
  console.log('WebSocket connection opened.');
images.forEach(img => {
  sendImageToServer(img)
})
  // Check if the provided image source is a URL or a local path
  if (imageUrlOrPath.startsWith('http')) {
    sendImageToServer(imageUrlOrPath)
  } else {
    // Read the local image file as binary data
    try {
      const imageBinaryData = fs.readFileSync(imageUrlOrPath);
      sendImageToServer(imageBinaryData);
    } catch (error) {
      console.error('Error reading local image file:', error);
    }
  }
});

// Handle WebSocket messages (predictions) received from the server
ws.on('message', (data) => {
  console.log('Received prediction:', data.toString());

  // Close the WebSocket connection after receiving the prediction
});

// Handle WebSocket connection closed
ws.on('close', () => {
  console.log('WebSocket connection closed.');
});

// Handle WebSocket connection errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
