import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt

# Sample dataset with two clusters + noise
X = np.array([
    [1, 2], [2, 2], [2, 3], [1.5, 2.5], [1.8, 2.8], [1.2, 2.1],
    [8, 7], [8, 8], [7.8, 8.2], [8.2, 7.8], [8.1, 7.9],
    [50, 50]  # noise point
])

# Create DBSCAN model
dbscan = DBSCAN(eps=3, min_samples=2)
dbscan.fit(X)

# Get cluster labels (-1 = noise)
labels = dbscan.labels_
print("Cluster labels:", labels)

# Plot clusters
plt.scatter(X[:, 0], X[:, 1], c=labels, cmap='plasma', s=100)
plt.title("DBSCAN Clustering")
plt.xlabel("X-axis")
plt.ylabel("Y-axis")
plt.show()

# Compute Silhouette Score (ignore noise points)
if len(set(labels)) > 1 and -1 not in labels:
    score = silhouette_score(X, labels)
    print("Silhouette Score:", score)
else:
    print("Silhouette Score cannot be computed properly due to noise points.")