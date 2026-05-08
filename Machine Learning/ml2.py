import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

# 1. Create Synthetic Dataset
# Age ranges from 18 to 65. Generally, older people buy insurance.
data = {
    'age': [22, 25, 47, 52, 46, 56, 55, 60, 62, 61, 18, 28, 27, 29, 49, 55, 25, 58, 19, 18],
    'bought_insurance': [0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0]
}
df = pd.DataFrame(data)

# 2. Visualize the raw data
plt.figure(figsize=(10, 6))
plt.scatter(df.age, df.bought_insurance, marker='+', color='red', s=100, label='Actual Data')

# 3. Split the data
# Use random_state for reproducible results
X_train, X_test, y_train, y_test = train_test_split(df[['age']], df.bought_insurance, train_size=0.8, random_state=42)

# 4. Initialize and Train Logistic Regression
model = LogisticRegression()
model.fit(X_train, y_train)

# 5. Make Predictions
y_predicted = model.predict(X_test)
y_probs = model.predict_proba(X_test)

print("--- Test Results ---")
print(f"X_test (Ages): \n{X_test.values.flatten()}")
print(f"Predictions (0=No, 1=Yes): {y_predicted}")
print(f"Accuracy Score: {model.score(X_test, y_test):.2f}")

# 6. Plotting the Sigmoid Curve
# We create a range of ages from 15 to 70 to see how the probability changes
X_range = np.linspace(15, 70, 100).reshape(-1, 1)
# model.predict_proba returns [prob_0, prob_1]. We want prob_1 (index 1)
loss = model.predict_proba(X_range)[:, 1]

plt.plot(X_range, loss, color='blue', label='Logistic Regression S-Curve')
plt.axhline(y=0.5, color='gray', linestyle='--', label='0.5 Threshold')
plt.xlabel("Age")
plt.ylabel("Probability of Buying Insurance")
plt.title("Logistic Regression: Insurance Purchase Prediction")
plt.legend()
plt.grid(alpha=0.3)
plt.show()