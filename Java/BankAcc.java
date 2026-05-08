class BankAccount {
    String accountHolder;
    double balance;
    double interestRate;
    BankAccount(String accountHolder, double balance, double interestRate) {
        this.accountHolder = accountHolder;
        this.balance = balance;
        this.interestRate = interestRate;}
    void deposit(double amount) {
        balance += amount;
        System.out.println("Deposited: " + amount);}
    void withdraw(double amount) {
        if (amount <= balance) {
            balance -= amount;
            System.out.println("Withdrawn: " + amount);
        } else {
            System.out.println("Insufficient balance!");}}
    final double calculateInterest() {
        return (balance * interestRate) / 100;}
    void display() {
        System.out.println("Account Holder: " + accountHolder);
        System.out.println("Balance       : " + balance);
        System.out.println("Interest Rate : " + interestRate + "%");
        System.out.println("Interest Earned: " + calculateInterest());
    }}
class SavingsAccount extends BankAccount {

    SavingsAccount(String accountHolder, double balance) {
        super(accountHolder, balance, 4.5); }}
class CurrentAccount extends BankAccount {
    CurrentAccount(String accountHolder, double balance) {
        super(accountHolder, balance, 2.0);}}
public class BankAcc{
    public static void main(String[] args) {
        SavingsAccount sa = new SavingsAccount("Alice", 10000);
        sa.deposit(5000);
        sa.withdraw(2000);

        System.out.println("\n--- Savings Account ---");
        sa.display();

        CurrentAccount ca = new CurrentAccount("Bob", 20000);
        ca.deposit(3000);
        ca.withdraw(1000);

        System.out.println("\n--- Current Account ---");
        ca.display();
    }
}