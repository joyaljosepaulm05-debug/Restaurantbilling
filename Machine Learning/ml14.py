import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
df = pd.read_csv("/Users/joyal/Downloads/HR_comma_sep.csv")
print(df.head())
pd.crosstab(df.salary, df.left).plot(kind='bar')
plt.xlabel("Salary")
plt.ylabel("Employee Count")
plt.show()
pd.crosstab(df.Department, df.left).plot(kind='bar')
plt.xlabel("Department")
plt.ylabel("Employee Count")
plt.xticks(rotation=45)
plt.show()
data = df[['satisfaction_level',
           'average_montly_hours',
           'promotion_last_5years',
           'salary',
           'Department']]
salary_dummies = pd.get_dummies(data.salary)
dept_dummies = pd.get_dummies(data.Department)
X = pd.concat([data, salary_dummies, dept_dummies], axis=1)
X = X.drop(['salary','Department'], axis=1)
y = df.left
X_train,X_test,y_train,y_test = train_test_split(
    X,y,test_size=0.2,random_state=42
)
model = LogisticRegression(max_iter=1000)
model.fit(X_train,y_train)
y_pred = model.predict(X_test)
print("Accuracy:",accuracy_score(y_test,y_pred))
