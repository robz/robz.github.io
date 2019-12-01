import tensorflow as tf
import tensorflowjs as tfjs
import numpy as np
import matplotlib.pyplot as plt

(x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()

x_train = x_train / 255
x_test = x_test / 255
x_train = tf.reshape(x_train, (len(x_train), 28 * 28))
x_test = tf.reshape(x_test, (len(x_test), 28 * 28))

x_val = x_train[-10000:]
y_val = y_train[-10000:]
x_train = x_train[:-10000]
y_train = y_train[:-10000]

model = tf.keras.Sequential(
   [
       tf.keras.layers.Dense(64, input_shape=(28 * 28,), activation="relu"),
       tf.keras.layers.Dense(64, activation="relu"),
       tf.keras.layers.Dense(10, activation="softmax"),
   ]
)
model.summary()
model.compile(
   optimizer=tf.keras.optimizers.RMSprop(),
   loss=tf.keras.losses.SparseCategoricalCrossentropy(),
   metrics=[tf.keras.metrics.SparseCategoricalAccuracy()],
)
model.fit(x_train, y_train, batch_size=64, epochs=10, validation_data=(x_val, y_val))

model.save('model/mnist_model.h5')
tfjs.converters.save_keras_model(model, 'model')

del model
model = tf.keras.models.load_model("model/mnist_model.h5")
print(model.predict(np.array([x_train[0]])))

#def draw_example(image, label):
#    plt.imshow(image, cmap=plt.get_cmap("gray"))
#    print("Label: ", label)
#
#draw_example(x_train[0], y_train[0])
#plt.show()
