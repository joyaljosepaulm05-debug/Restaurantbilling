class InsufficientBalanceException extends Exception {
    InsufficientBalanceException(String message) {
        super(message);
    }
}

// BankAccount class
class BankAccount {

    String accountHolder;
    double balance;

    // Constructor
    BankAccount(String accountHolder, double balance) {
        this.accountHolder = accountHolder;
        this.balance       = balance;
    }

    // Deposit method
    void deposit(double amount) {
        balance += amount;
        System.out.println("Amount Deposited : " + amount);
        System.out.println("Current Balance  : " + balance);
    }

    // Withdraw method — throws exception if balance is low
    void withdraw(double amount) throws InsufficientBalanceException {
        if (amount > balance) {
            throw new InsufficientBalanceException(
                "Insufficient Balance! Available balance: " + balance);
        }
        balance -= amount;
        System.out.println("Amount Withdrawn : " + amount);
        System.out.println("Current Balance  : " + balance);
    }

    // Display balance
    void displayBalance() {
        System.out.println("Account Holder   : " + accountHolder);
        System.out.println("Current Balance  : " + balance);
    }
}

// Main class
public class Bexce {
    public static void main(String[] args) {

        // Create bank account with initial balance
        BankAccount acc = new BankAccount("Arun", 5000.0);

        System.out.println("--- Bank Account Details ---");
        acc.displayBalance();

        // Deposit
        System.out.println("\n--- Depositing 2000 ---");
        acc.deposit(2000);

        // Withdraw — valid amount
        System.out.println("\n--- Withdrawing 3000 ---");
        try {
            acc.withdraw(3000);
        } catch (InsufficientBalanceException e) {
            System.out.println("Error: " + e.getMessage());
        }

        // Withdraw — insufficient balance
        System.out.println("\n--- Withdrawing 9000 ---");
        try {
            acc.withdraw(9000);
        } catch (InsufficientBalanceException e) {
            System.out.println("Error: " + e.getMessage());
        } finally {
            System.out.println("Transaction Completed.");
        }
    }
}