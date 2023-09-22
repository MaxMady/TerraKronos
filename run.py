import cv2
import numpy as np
import tensorflow as tf
import asyncio
import websockets
import io

print("Loading model...")
model = tf.keras.models.load_model("plant_safe.h5")
model.summary()
print("Loaded model!")

labels = ['Pepper__bell___Bacterial_spot', 'Pepper__bell___healthy', 'Potato___Early_blight', 'Potato___healthy',
          'Potato___Late_blight', 'Tomato__Target_Spot', 'Tomato__Tomato_mosaic_virus',
          'Tomato__Tomato_YellowLeaf__Curl_Virus', 'Tomato_Bacterial_spot', 'Tomato_Early_blight', 'Tomato_healthy',
          'Tomato_Late_blight', 'Tomato_Leaf_Mold', 'Tomato_Septoria_leaf_spot', 'Tomato_Spider_mites_Two_spotted_spider_mite']

async def classify_image(websocket, path):
    try:
        image_data = await websocket.recv()

        # Convert the received binary data to a NumPy array
        image_np = np.frombuffer(image_data, dtype=np.uint8)

        # Decode the NumPy array as an image (assuming it's in RGBA format)
        original_image = cv2.imdecode(image_np, cv2.IMREAD_UNCHANGED)

        print("Predicting...")
        # Resize the image to match dimensions required by the model
        img = cv2.resize(original_image, (224, 224))

        img = img / 255.0
        img = np.expand_dims(img, axis=0)

        pred = model.predict(img)
        idx = np.argmax(pred, axis=1).tolist()[0]
        
        pred_name = labels[idx]

        print(pred_name)
        await websocket.send(pred_name)
    except websockets.exceptions.ConnectionClosedOK:
        pass

start_server = websockets.serve(classify_image, "localhost", 8765)  # You can change the host and port as needed.

async def main():
    await start_server

if __name__ == "__main__":
    asyncio.get_event_loop().run_until_complete(main())
    asyncio.get_event_loop().run_forever()
