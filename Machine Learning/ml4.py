import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report

# Load and Preprocess (Your existing logic)
df = pd.read_csv(r"/Users/joyal/Downloads/titanic.csv")
df.drop(['PassengerId','Name','SibSp','Parch','Ticket','Cabin','Embarked'], axis='columns', inplace=True)

inputs = df.drop('Survived', axis='columns')
target = df.Survived

dummies = pd.get_dummies(inputs.Sex)
inputs = pd.concat([inputs, dummies], axis='columns')
inputs.drop(['Sex', 'male'], axis='columns', inplace=True)
inputs.Age = inputs.Age.fillna(inputs.Age.mean())

# Split Data
X_train, X_test, y_train, y_test = train_test_split(inputs, target, test_size=0.3)

# Train Model
model = GaussianNB()
model.fit(X_train, y_train)

# --- ADDED CODE TO PRINT OUTPUT ---

# 1. Print Accuracy
score = model.score(X_test, y_test)
print(f"Model Accuracy Score: {score:.4f} ({score*100:.2f}%)")

# 2. Print Predictions vs Actual for the first 10 rows
y_predicted = model.predict(X_test[0:10])
comparison_df = pd.DataFrame({
    'Actual_Survived': y_test[0:10].values,
    'Predicted_Survived': y_predicted
})
print("\n--- First 10 Predictions Comparison ---")
print(comparison_df)

# 3. Print Prediction Probabilities
# [Probability of Death (0), Probability of Survival (1)]
probs = model.predict_proba(X_test[0:10])
print("\n--- Prediction Probabilities (Died vs Survived) ---")
print(probs)

# 4. Detailed Classification Report
print("\n--- Detailed Classification Report ---")
print(classification_report(y_test, model.predict(X_test)))