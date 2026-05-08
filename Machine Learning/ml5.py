import pandas as pd
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import confusion_matrix, classification_report

# 1. Load Data
iris = load_iris()
df = pd.DataFrame(iris.data, columns=iris.feature_names)
df['target'] = iris.target

# 2. Split Data
X = df.drop(['target'], axis='columns')
y = df.target
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=1)

# 3. Create and Train KNN Classifier
# n_neighbors=10 means the model looks at the 10 closest points to decide the class
knn = KNeighborsClassifier(n_neighbors=10)
knn.fit(X_train, y_train)

# --- PRINTING OUTPUT ---

# 1. Overall Accuracy
accuracy = knn.score(X_test, y_test)
print(f"Model Accuracy: {accuracy * 100:.2f}%")

# 2. Predicting a Specific Sample
# [4.8, 3.0, 1.5, 0.3] is a sample input
sample_prediction = knn.predict([[4.8, 3.0, 1.5, 0.3]])
predicted_species = iris.target_names[sample_prediction[0]]
print(f"Prediction for [4.8, 3.0, 1.5, 0.3]: {predicted_species}")

# 3. Evaluation Metrics
y_pred = knn.predict(X_test)
print("\n--- Confusion Matrix ---")
print(confusion_matrix(y_test, y_pred))

print("\n--- Classification Report ---")
print(classification_report(y_test, y_pred, target_names=iris.target_names))