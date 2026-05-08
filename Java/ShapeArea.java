import java.util.Scanner;

// Interface
interface Shape {
    double calculateArea();
    void displayArea();
}

// Rectangle class
class Rectangle implements Shape {
    private double length, width;

    public Rectangle(double length, double width) {
        this.length = length;
        this.width  = width;
    }

    @Override
    public double calculateArea() {
        return length * width;
    }

    @Override
    public void displayArea() {
        System.out.printf("Rectangle    | Length = %.2f, Width = %.2f | Area = %.2f%n", length, width, calculateArea());
    }
}

// Triangle class
class Triangle implements Shape {
    private double base, height;

    public Triangle(double base, double height) {
        this.base   = base;
        this.height = height;
    }

    @Override
    public double calculateArea() {
        return 0.5 * base * height;
    }

    @Override
    public void displayArea() {
        System.out.printf("Triangle     | Base = %.2f, Height = %.2f | Area = %.2f%n", base, height, calculateArea());
    }
}

// Square class
class Square implements Shape {
    private double side;

    public Square(double side) {
        this.side = side;
    }

    @Override
    public double calculateArea() {
        return side * side;
    }

    @Override
    public void displayArea() {
        System.out.printf("Square       | Side = %.2f           | Area = %.2f%n", side, calculateArea());
    }
}

// Main class
public class ShapeArea {

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int choice;

        do {
            System.out.println("\n======= Shape Area Calculator =======");
            System.out.println("2. Rectangle");
            System.out.println("3. Triangle");
            System.out.println("4. Square");
            System.out.println("5. All Shapes (Demo)");
            System.out.println("0. Exit");
            System.out.print("Enter your choice: ");
            choice = sc.nextInt();

            switch (choice) {
                case 1:
                    System.out.print("Enter length: ");
                    double l = sc.nextDouble();
                    System.out.print("Enter width : ");
                    Shape rect = new Rectangle(l, sc.nextDouble());
                    rect.displayArea();
                    break;

                case 2:
                    System.out.print("Enter base  : ");
                    double b = sc.nextDouble();
                    System.out.print("Enter height: ");
                    Shape tri = new Triangle(b, sc.nextDouble());
                    tri.displayArea();
                    break;

                case 3:
                    System.out.print("Enter side: ");
                    Shape sq = new Square(sc.nextDouble());
                    sq.displayArea();
                    break;

                case 4:
                    System.out.println("\n------- Demo: All Shape Areas -------");
                    Shape[] shapes = {                 
                        new Rectangle(10, 5),
                        new Triangle(8, 6),
                        new Square(4)
                    };
                    System.out.printf("%-13s| %-30s| %s%n", "Shape", "Dimensions", "Area");
                    System.out.println("-------------------------------------------------------------");
                    for (Shape s : shapes) {
                        s.displayArea();
                    }
                    break;

                case 0:
                    System.out.println("Exiting... Goodbye!");
                    break;

                default:
                    System.out.println("Invalid choice. Try again.");
            }

        } while (choice != 0);

        sc.close();
    }
}