import numpy as np
import matplotlib.pyplot as plt
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
X = np.array([[0,0],
              [0,1],
              [1,0],
              [1,1]])

y = np.array([0, 1, 1, 0])

# Build Single Layer Perceptron
model = Sequential()
model.add(Dense(1, input_dim=2, activation='sigmoid'))

# Compile
model.compile(optimizer='sgd',
              loss='binary_crossentropy',
              metrics=['accuracy'])

# Train
model.fit(X, y, epochs=500, verbose=0)

# Evaluate
loss, accuracy = model.evaluate(X, y, verbose=0)
print("Accuracy:", accuracy)

# ---- Decision Boundary ----
weights, bias = model.layers[0].get_weights()

w1, w2 = weights[0][0], weights[1][0]
b = bias[0]

x_vals = np.linspace(-0.5, 1.5, 100)
y_vals = -(w1 * x_vals + b) / w2
plt.scatter(X[:,0], X[:,1], c=y, cmap='bwr', s=100)

# Plot boundary
plt.plot(x_vals, y_vals, 'k-')

plt.xlabel("Input 1")
plt.ylabel("Input 2")
plt.title("Perceptron Decision Boundary (XOR)")
plt.show()