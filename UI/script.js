// script.js
document.addEventListener("DOMContentLoaded", function () {
  const terminalOutput = document.getElementById("terminal-output");
  const commandInput = document.getElementById("command-input");

  // Add a new line to the terminal output
  function addLine(text) {
    const line = document.createElement("div");
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight; // Scroll to the bottom
  }

  commandInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      const command = commandInput.value;
      addLine(`> ${command}`);
      // Add your logic here to process the command
      // For this example, let's echo the command back
      addLine(`${command}`);
      commandInput.value = "";
    }
  });

  const videoElement = document.getElementById("camera-feed");
  const cameraUnavailableMessage = document.getElementById(
    "unavailable"
  );
  cameraUnavailableMessage.style.display = "none";

  // Check if the browser supports getUserMedia
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Access the user's camera
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        videoElement.srcObject = stream;
        cameraUnavailableMessage.style.display = "none"; // Hide the message
      })
      .catch(function (error) {
        console.error("Error accessing camera:", error);
        cameraUnavailableMessage.style.display = "block"; // Show the message
      });
  } else {
    console.error("getUserMedia is not supported in this browser");
    cameraUnavailableMessage.style.display = "block"; // Show the message
  }

  const startButton = document.getElementById("start-camera");
  const stopButton = document.getElementById("stop-camera");

  startButton.addEventListener("click", function () {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        videoElement.srcObject = stream;
        cameraUnavailableMessage.style.display = "none";
        videoElement.style.display = "block";
      })
      .catch(function (error) {
        console.error("Error accessing camera:", error);
      });
  });

  stopButton.addEventListener("click", function () {
    const stream = videoElement.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(function (track) {
        track.stop();
      });
      cameraUnavailableMessage.style.display = "block";
      videoElement.style.display = "none";
      videoElement.srcObject = null;
    }
  });
});
