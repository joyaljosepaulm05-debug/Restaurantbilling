public class AreaCalculator {
    static double calculateArea(double radius) {
        return Math.PI * radius * radius;
    }
    static double calculateArea(double length, double width) {
        return length * width;
    }
    static double calculateArea(double base, double height, String shape) {
        return 0.5 * base * height;
    }

    public static void main(String[] args) {
        double circleArea = calculateArea(7.0);
        System.out.printf("Area of Circle  = %.2f%n", circleArea);
        double rectangleArea = calculateArea(10.0, 5.0);
        System.out.printf("Area of Rectangle   = %.2f%n", rectangleArea);
        double triangleArea = calculateArea(8.0, 6.0, "triangle");
        System.out.printf("Area of Triangle  = %.2f%n", triangleArea);
    }
}
