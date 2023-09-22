const outputBox = document.getElementById("outputBox");
const videoElement = document.getElementById("cameraFeed");
const serverUrl = "ws://localhost:8765";

const ws = new WebSocket(serverUrl);
window.addEventListener("load", startCamera);

ws.onopen = () => {
  console.log("Connected");
  captureAndSendFrame();
};

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
  } catch (error) {
    console.error("Error accessing camera:", error);
  }
}

function captureAndSendFrame() {
  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const context = canvas.getContext("2d");
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Convert the frame to a buffer
  
  var data = context.getImageData(0, 0, 224, 224);;
  var buffer = new ArrayBuffer(data.length);
  var binary = new Uint8Array(buffer);
  for (var i = 0; i < binary.length; i++) {
    binary[i] = data[i];
  }
  ws.send(buffer);

  // Schedule the next frame capture
  setTimeout(captureAndSendFrame, 100); // Capture frame every 100ms
}

// Handle messages received from the server (if needed)
ws.onmessage = (event) => {
  const prediction = event.data;
  console.log("Received prediction from server:", prediction);

  // You can display the prediction in your HTML or perform further actions here
};

// Handle any errors that occur.
ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};
