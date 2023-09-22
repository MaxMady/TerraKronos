(async () => {

    //Model begin
    const labels = [
      "Pepper__bell___Bacterial_spot",
      "Pepper__bell___healthy",
      "Potato___Early_blight",
      "Potato___healthy",
      "Potato___Late_blight",
      "Tomato__Target_Spot",
      "Tomato__Tomato_mosaic_virus",
      "Tomato__Tomato_YellowLeaf__Curl_Virus",
      "Tomato_Bacterial_spot",
      "Tomato_Early_blight",
      "Tomato_healthy",
      "Tomato_Late_blight",
      "Tomato_Leaf_Mold",
      "Tomato_Septoria_leaf_spot",
      "Tomato_Spider_mites_Two_spotted_spider_mite",
    ];
    const MODEL_URL = "model/model.json";
    const model = await tf.loadLayersModel(MODEL_URL);
    await model.summary();
    console.log(`Successfully loaded model!`);
    let head = (document.getElementById("load").innerHTML =
      "<h3>Model has been loaded! Enjoy your stay!\n<b>Upload pokemon image below</b></h3>");
    document.getElementById("file-input").disabled = false;
    //--------------------Model End-----------------------
  
    let imageElement = document.getElementById("myImg");
    const predictionElement = document.getElementById("prediction");
  
    const webcam = document.getElementById("webcam");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const cameraSelect = document.getElementById("cameraSelect");
  
    function populateCameraList() {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                devices.forEach(device => {
                    if (device.kind === 'videoinput') {
                        const option = document.createElement('option');
                        option.value = device.deviceId;
                        option.text = device.label || `Camera ${cameraSelect.length + 1}`;
                        cameraSelect.appendChild(option);
                    }
                });
            })
            .catch(error => {
                console.error('Error enumerating devices:', error);
            });
    }
    
    // Function to set the selected camera
    function setCamera() {
        const selectedCamera = cameraSelect.value;
        const constraints = {
            video: { deviceId: selectedCamera }
        };
    
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                webcam.srcObject = stream;
            })
            .catch(error => {
                console.error('Error accessing camera:', error);
            });
    }
    
    // Populate the camera list when the page loads
    populateCameraList();
    
    // Add an event listener to the camera dropdown
    cameraSelect.addEventListener("change", setCamera);
    
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        webcam.srcObject = stream;
      })
      .catch(function (error) {
        console.error("Error accessing the webcam:", error);
      });
  
    webcam.onloadedmetadata = function () {
      canvas.width = webcam.videoWidth;
      canvas.height = webcam.videoHeight;
  
      const drawFrame = async () => {
        ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/png");
  
        await inference(imageData, model, labels);
        requestAnimationFrame(drawFrame, model);
      };
  
      drawFrame();
    };
  
    /*
    const inputShape = [null, 224, 224, 3];
    document
      .querySelector('input[type="file"]')
      .addEventListener("change", async function () {
        if (this.files && this.files[0]) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const img = document.querySelector("img");
            img.onload = async () => {
              img.style.visibility = true;
              console.log(img.src);
              imageElement = img;
              const tensor = tf.browser
                .fromPixels(img)
                .resizeNearestNeighbor([224, 224])
                .toFloat()
                .expandDims();
  
              console.log(`Loading...`);
              const mean = tf.tensor([0.485, 0.456, 0.406]);
              const std = tf.tensor([0.229, 0.224, 0.225]);
              const normalized = tensor.div(tf.scalar(255)).sub(mean).div(std);
              const reshaped = normalized.reshape([-1, 224, 224, 3]);
  
              const prediction = await model.predict(reshaped).data();
  
              console.log(prediction);
              const classNames = labels;
              const classIndex = tf.argMax(prediction).dataSync()[0];
              const className = classNames[classIndex];
  
              // Display the prediction
              predictionElement.innerHTML = `Predicted Pokemon: ${className}`;
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(this.files[0]);
        }
      });
      */
  })();
  let i = 0
  let last = new Date()
  async function inference(image, model, labels) {
      let d = Math.abs(last-new Date())
      if(d < 2500) return;
      else
      last = new Date()
      //if(i == 10) return
      //else i++;
    const img = new Image();
  
    img.src = image;
    img.onload = async function () {
      imageElement = img;
      socket.send("predict", img)
      const tensor = tf.browser
        .fromPixels(img)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .expandDims();
    
      const mean = tf.tensor([0.485, 0.456, 0.406]);
      const std = tf.tensor([0.229, 0.224, 0.225]);
      const normalized = tensor.div(tf.scalar(255)).sub(mean).div(std);
      const reshaped = normalized.reshape([-1, 224, 224, 3]);
    
      const prediction = await model.predict(reshaped).data();
    
      console.log(prediction);
      const classNames = labels;
      const classIndex = tf.argMax(prediction).dataSync()[0];
      const className = classNames[classIndex];
      const predictionElement = document.getElementById("prediction");
  
      predictionElement.innerHTML = `Predicted disease: ${className}`;
    }
    return;
  
  }