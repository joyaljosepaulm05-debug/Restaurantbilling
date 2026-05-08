import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import AgglomerativeClustering
from scipy.cluster.hierarchy import dendrogram
from sklearn.datasets import make_blobs

# 1. Generate Synthetic Data
# We create 30 samples clustered around 3 centers
X, _ = make_blobs(n_samples=30, centers=3, cluster_std=1.0, random_state=42)

# 2. Fit the Agglomerative Clustering model
# Here we explicitly ask for 3 clusters
clustering = AgglomerativeClustering(n_clusters=3)
labels = clustering.fit_predict(X)

# 3. Fit a model specifically for the Dendrogram
# We set n_clusters=None and distance_threshold=0 to compute the full tree
agg = AgglomerativeClustering(distance_threshold=0, n_clusters=None)
agg = agg.fit(X)

# 4. Function to create the Linkage Matrix for the Dendrogram
def plot_dendrogram(model, **kwargs):
    # Create linkage matrix and then plot the dendrogram
    counts = np.zeros(model.children_.shape[0])
    n_samples = len(model.labels_)

    for i, merge in enumerate(model.children_):
        current_count = 0
        for child_idx in merge:
            if child_idx < n_samples:
                current_count += 1  # Leaf node
            else:
                current_count += counts[child_idx - n_samples]
        counts[i] = current_count

    linkage_matrix = np.column_stack(
        [model.children_, model.distances_, counts]
    ).astype(float)

    # Plot the corresponding dendrogram
    dendrogram(linkage_matrix, **kwargs)

# 5. Visualization
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Subplot 1: Scatter Plot of Clustered Data
ax1.scatter(X[:, 0], X[:, 1], c=labels, cmap='viridis', s=70, edgecolors='black')
ax1.set_title("Agglomerative Clustering Results (K=3)")
ax1.set_xlabel("Feature 1")
ax1.set_ylabel("Feature 2")

# Subplot 2: The Dendrogram
plt.sca(ax2)
plot_dendrogram(agg, truncate_mode='level', p=5)
plt.title("Hierarchical Clustering Dendrogram")
plt.xlabel("Sample index (or cluster size)")
plt.ylabel("Distance (Euclidean)")

plt.tight_layout()
plt.show()