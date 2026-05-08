import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

# 1. Create the dataset intrinsically
data = {
    'experience': [np.nan, np.nan, 5, 2, 7, 8, 9, 11],
    'test_score': [8, 8, 6, 10, 9, 7, np.nan, 7],
    'interview_score': [9, 6, 7, 10, 6, 10, 7, 8],
    'salary': [50000, 45000, 60000, 65000, 70000, 62000, 72000, 80000]
}

df = pd.DataFrame(data)

print("--- Original Dataset ---")
print(df)

# ---------------------------------------------------
# 2a. Fill NaN values with ZERO
# ---------------------------------------------------
df_zero = df.copy()
df_zero = df_zero.fillna(0)

print("\n--- Dataset (NaN filled with 0) ---")
print(df_zero)

# ---------------------------------------------------
# 2b. Fill NaN values with MEAN of experience
# ---------------------------------------------------
df_avg = df.copy()
# Note: Instructions specify using the average of the 'experience' column
exp_mean = df_avg['experience'].mean()
df_avg['experience'] = df_avg['experience'].fillna(exp_mean)
# Filling remaining NaNs in other columns with 0 or their respective means to allow regression
df_avg = df_avg.fillna(df_avg.mean())

print("\n--- Dataset (NaN filled with Mean) ---")
print(df_avg)

# ---------------------------------------------------
# 3. Create Linear Regression Models
# ---------------------------------------------------
# Model A (Zero filled)
X_zero = df_zero[["experience", "test_score", "interview_score"]]
y_zero = df_zero["salary"]
model_zero = LinearRegression().fit(X_zero, y_zero)

# Model B (Average filled)
X_avg = df_avg[["experience", "test_score", "interview_score"]]
y_avg = df_avg["salary"]
model_avg = LinearRegression().fit(X_avg, y_avg)

# Define candidates for prediction
candidates = pd.DataFrame({
    "experience": [20, 1, 10],
    "test_score": [6, 2, 10],
    "interview_score": [10, 2, 10]
})

pred_zero = model_zero.predict(candidates)
pred_avg = model_avg.predict(candidates)

print("\n--- Salary Predictions ---")
results = pd.DataFrame({
    "Candidate": ["A", "B", "C"],
    "Zero_Model_Pred": pred_zero,
    "Avg_Model_Pred": pred_avg
})
print(results)

# ---------------------------------------------------
# 4. Compare Performance
# ---------------------------------------------------
mse_zero = mean_squared_error(y_zero, model_zero.predict(X_zero))
mse_avg = mean_squared_error(y_avg, model_avg.predict(X_avg))

print("\n--- Model Comparison (Training MSE) ---")
print(f"MSE (Zero Filled):    {mse_zero:.2f}")
print(f"MSE (Average Filled): {mse_avg:.2f}")

if mse_zero < mse_avg:
    print("Result: Zero-filled model has a lower error on this training set.")
else:
    print("Result: Average-filled model has a lower error on this training set.")