import java.util.Scanner;

public class MenuCalculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int choice;
        double a, b, result;

        do {
            // Display Menu
            System.out.println("\n--- Calculator Menu ---");
            System.out.println("1. Addition");
            System.out.println("2. Subtraction");
            System.out.println("3. Multiplication");
            System.out.println("4. Division");
            System.out.println("5. Exit");
            System.out.print("Enter choice (1-5): ");
            choice = sc.nextInt();

            if (choice == 5) {
                System.out.println("Exiting... Bye!");
                break;
            }

            System.out.print("Enter first number: ");
            a = sc.nextDouble();
            System.out.print("Enter second number: ");
            b = sc.nextDouble();

            switch (choice) {
                case 1:
                    result = a + b;
                    System.out.println("Result: " + a + " + " + b + " = " + result);
                    break;

                case 2:
                    result = a - b;
                    System.out.println("Result: " + a + " - " + b + " = " + result);
                    break;

                case 3:
                    result = a * b;
                    System.out.println("Result: " + a + " * " + b + " = " + result);
                    break;

                case 4:
                    if (b == 0) {
                        System.out.println("Error: Cannot divide by zero!");
                    } else {
                        result = a / b;
                        System.out.println("Result: " + a + " / " + b + " = " + result);
                    }
                    break;

                default:
                    System.out.println("Invalid choice! Enter 1 to 5.");
            }

        } while (choice != 5);

        sc.close();
    }
}