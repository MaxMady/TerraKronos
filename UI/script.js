const startTime = new Date();
// Data initialization
let data = {
  time: new Array(20).fill(""),
  temperature: new Array(20).fill(0),
  humidity: new Array(20).fill(0),
  moisture: new Array(20).fill(0),
  ppm: new Array(20).fill(0),
};
data.time[9] = `${new Date().getHours()}:${new Date().getMinutes()}.${new Date().getSeconds()}`;

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", function () {
  // Initialize a socket connection
  const socket = io("http://localhost:3000");

  // Socket connection handling
  socket.on("connect", () => {
    console.log("Connected to the server");
    socket.emit("join", "joined"); // Handshake
    document.getElementById("status").innerHTML = `🟢 Online`
  });

  // Initialize the chart
  initChart();
  // Update the timestamp every second
  setInterval(updateTimestamp, 1000);
  // DOM elements
  const terminalOutput = document.getElementById("terminal-output");
  const commandInput = document.getElementById("command-input");

  // Function to add a line to the terminal
  function addLine(text, clear) {
    if (clear) terminalOutput.innerHTML = "";
    const line = document.createElement("div");
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  // Update data from the socket
  updateData(socket);

  //Manual controls
  let irrigate = document.getElementById("irrigate")
  let water = document.getElementById("water")
  irrigate.addEventListener('click', function() {
    let clr = `#00ff15`
    clr = irrigate.style.backgroundColor == clr?`red`:clr
    irrigate.style.backgroundColor = clr
    irrigate.classList.add('button-clicked');
    setTimeout(function() {
      irrigate.classList.remove('button-clicked');
    }, 500);
  });


  // Socket message handling
  socket.on("message", (message) => {
    if (typeof message === "object" || typeof message === "array")
      message = JSON.stringify(message);
    if (message.includes("connected")) addLine(message, true);
    else addLine(message);
  });

  // Handle command input
  commandInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      const command = commandInput.value;
      addLine(`> ${command}`);
      socket.emit("recieve", command);
      commandInput.value = "";
    }
  });
/* AI Prediction Start */
  const videoElement = document.getElementById("camera-feed");
  const cameraUnavailableMessage = document.getElementById("unavailable");
  cameraUnavailableMessage.style.display = "none";

  // Check if the browser supports getUserMedia
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Access the user's camera
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        videoElement.srcObject = stream;
        cameraUnavailableMessage.style.display = "none";

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Function to capture and process a frame
        function captureFrame() {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          ctx.drawImage(videoElement, 0, 0);

          let img = canvas.toDataURL("image/png"); // Change format if needed
          socket.emit("predict", img.toString());

          // Continue capturing frames
          requestAnimationFrame(captureFrame);
        }

        // Start capturing frames
        requestAnimationFrame(captureFrame);
      })
      .catch(function (error) {
        console.error("Error accessing camera:", error);
        cameraUnavailableMessage.style.display = "block";
      });
  } else {
    console.error("getUserMedia is not supported in this browser");
    cameraUnavailableMessage.style.display = "block";
  }

  // Start and stop camera buttons
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
  /* AI Prediction END*/

  socket.on("predicted", (data) => {
    let log = document.getElementById("prediction")
    let str = ``;
    data.forEach((e, i) => {
      str += `${i+1}. ${e['class']} - ${e.conf.toFixed(2)}% <br>`
    })
    console.log(str)
    log.innerHTML = str;
  })

});

// Initialize the chart
function initChart() {
  chart = new Chart("chart", {
    type: "line",
    data: {
      labels: data.time,
      datasets: [
        {
          data: data.temperature,
          borderColor: "red",
          fill: false,
        },
        {
          data: data.humidity,
          borderColor: "green",
          fill: false,
        },
        {
          data: data.moisture,
          borderColor: "blue",
          fill: false,
        },
      ],
    },
    options: {
      legend: { display: false },
    },
  });
}

// Update data from the socket
function updateData(socket) {
  let temperature = document.getElementById("temperature");
  let humidity = document.getElementById("humidity");
  let moisture = document.getElementById("moisture");

  let c = 3;
  socket.on("update", (msg) => {
    let json = JSON.parse(msg);
    if (c != 3) return c++;
    c = 1;
    let time = `${new Date().getHours()}:${new Date().getMinutes()}.${new Date().getSeconds()}`;
    let op = {
      time: time,
      temperature: json["temperature"],
      humidity: json["humidity"],
      ppm: json["ppm"],
      moisture: json["moisture"],
    };
    // Format moisture
    let moi = (100 - (op.moisture / 1023) * 100).toFixed(3);
    data.time = shift(data.time, time);
    data.humidity = shift(data.humidity, op.humidity);
    data.temperature = shift(data.temperature, op.temperature);
    data.ppm = shift(data.ppm, op.ppm);
    data.moisture = shift(data.moisture, moi);

    // Update the chart data
    chart.data.labels = data.time;
    chart.data.datasets[0].data = data.temperature;
    chart.data.datasets[1].data = data.humidity;
    chart.data.datasets[2].data = data.moisture;
    chart.update();

    temperature.textContent = `> Temperature: ${op.temperature} °C`;
    humidity.textContent = `> Humidity: ${op.humidity}%`;
    moisture.textContent = `> Soil Wetness: ${(
      100 -
      (op.moisture / 1023) * 100
    ).toFixed(3)}%`;
    handleFuncs(
      {
        moisture: moi,
        temperature: op.temperature,
        humidity: op.humidity,
        ppm: ppm,
      },
      socket
    );
    console.log(data);
  });
}

// Shift elements in an array
function shift(array, item) {
  array.shift();
  array.push(item);
  return array;
}

// Function to handle certain conditions
function handleFuncs(data, socket) {
  if (data.moisture < 40) socket.emit("recieve", "o");
  else socket.emit("recieve", "f");
}

function updateTimestamp() {
  const timestampElement = document.getElementById("time");
  const now = new Date();

  // Calculate the time difference in seconds
  const timeDifferenceInSeconds = Math.abs(Math.floor((now - startTime) / 1000));

  // Update the timestamp element
  if (timeDifferenceInSeconds < 60) {
    timestampElement.textContent = `${timeDifferenceInSeconds} second${timeDifferenceInSeconds !== 1 ? 's' : ''} ago`;
  } else if (timeDifferenceInSeconds < 3600) {
    const minutes = Math.floor(timeDifferenceInSeconds / 60);
    timestampElement.textContent = `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (timeDifferenceInSeconds < 86400) {
    const hours = Math.floor(timeDifferenceInSeconds / 3600);
    timestampElement.textContent = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(timeDifferenceInSeconds / 86400);
    timestampElement.textContent = `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}