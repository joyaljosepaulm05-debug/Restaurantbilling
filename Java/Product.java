public class Product {

    // Data members
    int pcode;
    String pname;
    double price;

    // Constructor
    Product(int code, String name, double p) {
        pcode  = code;
        pname  = name;
        price  = p;
    }

    public static void main(String[] args) {

        // Create three objects using constructor
        Product p1 = new Product(101, "Apple",  50.0);
        Product p2 = new Product(102, "Mango",  30.0);
        Product p3 = new Product(103, "Orange", 40.0);

        // Display all products
        System.out.println("All Products:");
        System.out.println("Code: " + p1.pcode + "  Name: " + p1.pname + "  Price: " + p1.price);
        System.out.println("Code: " + p2.pcode + "  Name: " + p2.pname + "  Price: " + p2.price);
        System.out.println("Code: " + p3.pcode + "  Name: " + p3.pname + "  Price: " + p3.price);

        // Find lowest price
        Product lowest = p1;

        if (p2.price < lowest.price) {
            lowest = p2;
        }
        if (p3.price < lowest.price) {
            lowest = p3;
        }

        // Display lowest price product
        System.out.println("\nLowest Price Product:");
        System.out.println("Code: " + lowest.pcode + "  Name: " + lowest.pname + "  Price: " + lowest.price);
    }
}