import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
import numpy as np

# 1. Create a synthetic dataset (since we don't have the CSV)
data = pd.DataFrame({
    'Size': [1100, 1500, 1800, 2100, 2500, 3000, 3200, 3500],
    'Price': [250000, 300000, 340000, 410000, 480000, 550000, 590000, 640000]
})

# 2. Separate features (X) and target (y)
# Use [['Size']] to ensure X is a 2D array/DataFrame
X = data[['Size']] 
y = data['Price']

# 3. Create and train the model
model = LinearRegression()
model.fit(X, y)

# 4. Predict values for the regression line
y_pred = model.predict(X)

# 5. Visualization
plt.figure(figsize=(10, 6))

# Plot actual data points
plt.scatter(X, y, color='royalblue', label="Actual Prices", s=80, edgecolors='black')

# Plot the regression line
plt.plot(X, y_pred, color='red', linewidth=2, label="Regression Line (Best Fit)")

# Labels and title
plt.xlabel("House Size (sq.ft)")
plt.ylabel("House Price ($)")
plt.title("Simple Linear Regression: House Size vs Price")
plt.grid(True, linestyle='--', alpha=0.6)
plt.legend()

# Show the graph
plt.show()

# Quick Insight: Print the slope and intercept
print(f"Model Formula: Price = {model.coef_[0]:.2f} * Size + {model.intercept_:.2f}")