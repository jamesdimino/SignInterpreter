from keras.models import load_model
from PIL import Image, ImageOps
import numpy as np
import sys
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

characters = ['a', 'b', 'c', 'd', 'e', 'f']

def getLetter(class_name):
    for char in characters:
        if ('asl_' + char) in class_name:
            return char
    else:
        return '-'


np.set_printoptions(suppress=True)

model = load_model('/Users/james/Downloads/converted_keras/keras_model.h5', compile=False)
class_names = open("/Users/james/Downloads/converted_keras/labels.txt", "r").readlines()

data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)

example_path = sys.argv[1]
word = ''

image_list = sorted(os.listdir('/Users/james/Desktop/DirectedStudy/SignInterpreter/Examples/' + example_path))
for image_path in image_list:
    image = Image.open("/Users/james/Desktop/DirectedStudy/SignInterpreter/Examples/" + example_path + "/" + image_path).convert("RGB")

    size = (224, 224)
    image = ImageOps.fit(image, size, Image.LANCZOS)

    image_array = np.asarray(image)

    normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1

    data[0] = normalized_image_array

    prediction = model.predict(data)
    index = np.argmax(prediction)
    class_name = class_names[index]
    confidence_score = prediction[0][index]
    if confidence_score > .90:
        word += getLetter(class_name)

print("The word is: " + word)
