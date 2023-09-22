const { SerialPort } = require("serialport");
const express = require("express");
const PImage = require("pureimage");
const { Readable } = require("stream");
const { JSDOM } = require("jsdom");
const parseDataUrl = require("parse-data-url");
const wait = require("node:timers/promises").setTimeout;
const { window } = new JSDOM();

const app = express();
const document = window.document;

//const cors = require('cors');
//app.use(cors());
const tf = require("@tensorflow/tfjs");
(async () => {
  const MODEL_URL =
    "https://raw.githubusercontent.com/MaxMady/TerraKronos/ai/content/tfjs/model.json";
  const model = await tf.loadLayersModel(MODEL_URL);
  global.model = model;
  await model.summary();

  const labels = [
    "Bacterial Spot/Pepper bell",
    "Healthy/Pepper bell",
    "Early blight/Potato",
    "Healthy/Potato",
    "Late blight/Potato",
    "Target Spot/Tomato",
    "Mosaic virus/Tomato",
    "Yellow Leaf Curl Virus/Tomato",
    "Bacterial Spot/Tomato",
    "Unhealthy/Tomato",
    "Healthy/Tomato",
    "Unhealthy/Tomato",
    "LeafMold/Tomato",
    "Septoria Leaf Spot/Tomato",
    "Two Spotted Spider mite/Tomato",
  ];

  const server = require("http").createServer(app);
  const io = require("socket.io")(server, {
    cors: {
      origin: `http://localhost:5500`,
      methods: ["GET", "POST"],
    },
  });
  const endPort = process.env.PORT || 3000;

  let port;
  try {
    port = new SerialPort({ path: "COM3", baudRate: 9600 });
  } catch (err) {
    console.log(err);
  }
  let connected = false;

  server.listen(endPort, () => {
    console.log("Server listening at port %d", endPort);
  });

  io.on("connection", (socket) => {
    module.exports = socket;
    let nonC = ``;
    port.on("data", function (dat) {
      if (connected) {
        if (dat.toString().includes("}")) {
          nonC += dat.toString();
          try {
            let json = nonC;
            socket.emit("update", json);
            socket.emit(`message`, json);
          } catch (err) {
            console.log(err);
          }
          nonC = ``;
        } else {
          nonC += dat.toString();
        }
      }
    });
    socket.on("recieve", (message) => {
      try {
        console.log(`> ${message}`);
        port.write(message + `\r\n`);
      } catch (e) {
        console.log(e);
      }
    });
    socket.on("join", (data) => {
      console.log(data);
      connected = true;
      socket.emit(
        "message",
        `You have been successfully connected to the server!`
      );
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected...");
    });
    let last = new Date();
    socket.on("predict", async (data) => {
      //console.log(data)
      if(Math.abs(last-new Date()) < 2500) return;
      last = new Date()
      let img = await processData(data);
      const tensor = tf.browser
        .fromPixels(img)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .expandDims();

      const mean = tf.tensor([0.485, 0.456, 0.406]);
      const std = tf.tensor([0.229, 0.224, 0.225]);
      const normalized = tensor.div(tf.scalar(255)).sub(mean).div(std);
      const reshaped = normalized.reshape([-1, 224, 224, 3]);

      const predictions = await model.predict(reshaped).data();
      const classNames = labels;

      // Get the indices of the top N predictions, in this case, N = 3
      const topN = 3;
      const topIndices = getTopIndices(predictions, topN);
      let op = [];
      // Print the top N predictions and their confidence percentages
      console.clear();

      for (let i = 0; i < topN; i++) {
        const classIndex = topIndices[i];
        const confidence = predictions[classIndex] * 100; // Convert to percentage
        const className = classNames[classIndex];
        op.push({class: className, conf: confidence})
        //console.log(`Prediction ${i + 1}: ${className} (Confidence: ${confidence.toFixed(2)}%)`);
      }
      console.log(op)
      socket.emit("predicted", op);
      console.log("meh")
      function getTopIndices(arr, n) {
        const copy = [...arr]; // Create a copy of the array
        const result = [];
        for (let i = 0; i < n; i++) {
          const maxIndex = copy.indexOf(Math.max(...copy));
          result.push(maxIndex);
          copy[maxIndex] = -Infinity; // Set the maximum value to -Infinity to find the next max
        }
        return result;
      }
    });
  });
})();
async function processData(image) {
  data = parseDataUrl(image);

  contentType = data.contentType;
  buffer = data.toBuffer();

  const stream = bufferToStream(buffer);
  let imageBitmap;

  if (/png/.test(contentType)) {
    imageBitmap = await PImage.decodePNGFromStream(stream);
  }

  if (/jpe?g/.test(contentType)) {
    imageBitmap = await PImage.decodeJPEGFromStream(stream);
  }
  return imageBitmap;
}

const bufferToStream = (binary) => {
  const readableInstanceStream = new Readable({
    read() {
      this.push(binary);
      this.push(null);
    },
  });

  return readableInstanceStream;
};

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});
