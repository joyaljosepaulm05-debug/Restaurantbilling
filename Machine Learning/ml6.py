import pandas as pd
from matplotlib import pyplot as plt
from sklearn.cluster import KMeans
from sklearn.preprocessing import MinMaxScaler

# 1. Load Data
df = pd.read_csv(r"/Users/joyal/Downloads/income.csv")

# 2. Initial Visualization
plt.scatter(df.Age, df['Income($)'])
plt.xlabel('Age')
plt.ylabel('Income($)')
plt.show()

# 3. Elbow Plot to find optimal K
sse = []
k_rng = range(1, 10)
for k in k_rng:
    km = KMeans(n_clusters=k)
    km.fit(df[['Age', 'Income($)']])
    sse.append(km.inertia_)

plt.title('Elbow Plot')
plt.xlabel('K')
plt.ylabel('Sum of squared error (SSE)')
plt.plot(k_rng, sse)
plt.show()

# 4. Preprocessing using Min-Max Scaler
# This is crucial because Income values are much larger than Age values
scaler = MinMaxScaler()

scaler.fit(df[['Income($)']])
df['Income($)'] = scaler.transform(df[['Income($)']])

scaler.fit(df[['Age']])
df['Age'] = scaler.transform(df[['Age']])

# 5. Training K-Means with Scaled Data
km = KMeans(n_clusters=3)
y_predicted = km.fit_predict(df[['Age', 'Income($)']])
df['cluster'] = y_predicted

# 6. Final Visualization with Centroids
df1 = df[df.cluster == 0]
df2 = df[df.cluster == 1]
df3 = df[df.cluster == 2]

plt.scatter(df1.Age, df1['Income($)'], color='green', label='Cluster 0')
plt.scatter(df2.Age, df2['Income($)'], color='red', label='Cluster 1')
plt.scatter(df3.Age, df3['Income($)'], color='black', label='Cluster 2')

# Plotting the centroids
plt.scatter(km.cluster_centers_[:, 0], km.cluster_centers_[:, 1], 
            color='purple', marker='*', s=200, label='centroid')

plt.xlabel('Age (Scaled)')
plt.ylabel('Income (Scaled)')
plt.legend()
plt.title('Final K-Means Clusters')
plt.show()

# Output Results
print("Cluster Centers:\n", km.cluster_centers_)
print("\nClustered Data Head:\n", df.head())