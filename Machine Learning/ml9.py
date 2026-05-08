import numpy as np
import matplotlib.pyplot as plt
from sklearn import svm

# AND dataset
X = np.array([[0,0],
              [0,1],
              [1,0],
              [1,1]])

y = np.array([0, 0, 0, 1])

# Train SVM (linear kernel)
model = svm.SVC(kernel='linear', C=1000)
model.fit(X, y)

# Get hyperplane
w = model.coef_[0]
b = model.intercept_[0]

# Create line
x_vals = np.linspace(-0.5, 1.5, 100)
y_vals = -(w[0]*x_vals + b) / w[1]

# Margins
margin = 1 / np.sqrt(np.sum(w**2))
y_vals_margin1 = y_vals + margin
y_vals_margin2 = y_vals - margin
plt.scatter(X[:,0], X[:,1], c=y, cmap='bwr', s=100)
plt.plot(x_vals, y_vals, 'k-', label='Decision Boundary')
plt.plot(x_vals, y_vals_margin1, 'k--', label='Margin')
plt.plot(x_vals, y_vals_margin2, 'k--')
plt.scatter(model.support_vectors_[:,0],
            model.support_vectors_[:,1],
            s=200, facecolors='none', edgecolors='k', label='Support Vectors')
plt.xlabel("Input 1")
plt.ylabel("Input 2")
plt.title("SVM Decision Boundary with Margins (AND Gate)")
plt.legend()
plt.show()