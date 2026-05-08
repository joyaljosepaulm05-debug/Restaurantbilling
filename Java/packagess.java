import arithmetic.ArithmeticOperations;
import java.util.Scanner;
public class packagess {
    public static void main(String[] args) {
        ArithmeticOperations calc = new ArithmeticOperations();
        Scanner sc = new Scanner(System.in);
        int choice;

        do {
            System.out.println("\n====== Arithmetic Operations Menu ======");
            System.out.println("1. Addition");
            System.out.println("2. Subtraction");
            System.out.println("3. Multiplication");
            System.out.println("4. Division");
            System.out.println("0. Exit");
            System.out.print("Enter your choice: ");
            choice = sc.nextInt();

            if (choice >= 1 && choice <= 4) {
                System.out.print("Enter first number : ");
                double a = sc.nextDouble();
                System.out.print("Enter second number: ");
                double b = sc.nextDouble();

                switch (choice) {
                    case 1:
                        System.out.println("Result: " + a + " + " + b + " = " + calc.add(a, b));
                        break;
                    case 2:
                        System.out.println("Result: " + a + " - " + b + " = " + calc.subtract(a, b));
                        break;
                    case 3:
                        System.out.println("Result: " +  a + " * " + b + " = " + calc.multiply(a, b));
                        break;
                    case 4:
                        System.out.println("Result: " + a + " / " + b + " = " + calc.divide(a, b));
                        break;
                }

            } else if (choice == 0) {
                System.out.println("Exiting... Goodbye!");

            } else {
                System.out.println("Invalid choice. Try again.");
            }

        } while (choice != 0);

        sc.close();
    }
}