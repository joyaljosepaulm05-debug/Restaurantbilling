import pandas as pd
import matplotlib.pyplot as plt
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# 1. Create/Load Dataset (Intrinsic)
data = {
    'Income': [20000, 25000, 30000, 40000, 50000, 60000, 70000, 22000, 35000, 55000],
    'CreditScore': [550, 580, 600, 650, 700, 720, 750, 560, 620, 710],
    'LoanApproved': [0, 0, 0, 1, 1, 1, 1, 0, 0, 1]  # 0: No, 1: Yes
}
df = pd.DataFrame(data)

# 2. Features and Target
X = df[['Income', 'CreditScore']]
y = df['LoanApproved']

# 3. Split data (Essential for Evaluation)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# 4. Train CART Decision Tree
# Note: criterion='gini' is CART; criterion='entropy' would be ID3/C4.5
model = DecisionTreeClassifier(criterion='gini', max_depth=3)
model.fit(X_train, y_train)

# 5. EVALUATE PERFORMANCE
y_pred = model.predict(X_test)
print("--- Model Evaluation ---")
print(f"Accuracy: {accuracy_score(y_test, y_pred) * 100}%")
print("\nDetailed Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Denied', 'Approved']))

# 6. Visualize the Tree logic
plt.figure(figsize=(10,6))
plot_tree(model, feature_names=['Income', 'CreditScore'], 
          class_names=['No', 'Yes'], filled=True)
plt.show()