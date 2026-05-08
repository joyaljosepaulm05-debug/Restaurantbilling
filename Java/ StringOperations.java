import java.util.Scanner;
public class StringOperations {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // ─────────────────────────────────────
        // 1. LENGTH OF A STRING
        // ─────────────────────────────────────
        System.out.print("Enter a string: ");
        String str = sc.nextLine();

        int length = str.length();
        System.out.println("Length of \"" + str + "\" = " + length);

        // ─────────────────────────────────────
        // 2. JOIN (CONCATENATE) TWO STRINGS
        // ─────────────────────────────────────
        System.out.print("\nEnter first string  : ");
        String s1 = sc.nextLine();

        System.out.print("Enter second string : ");
        String s2 = sc.nextLine();

        String joined = s1.concat(s2);          // using concat()
        String joined2 = s1 + " " + s2;         // using + operator

        System.out.println("Using concat() : " + joined);
        System.out.println("Using +        : " + joined2);

        // ─────────────────────────────────────
        // 3. COMPARE TWO STRINGS
        // ─────────────────────────────────────
        System.out.print("\nEnter first string to compare  : ");
        String a = sc.nextLine();

        System.out.print("Enter second string to compare : ");
        String b = sc.nextLine();

        // equals() — case sensitive
        if (a.equals(b)) {
            System.out.println("equals()        : Strings are EQUAL");
        } else {
            System.out.println("equals()        : Strings are NOT EQUAL");
        }

        // equalsIgnoreCase() — case insensitive
        if (a.equalsIgnoreCase(b)) {
            System.out.println("equalsIgnoreCase: Strings are EQUAL (ignoring case)");
        } else {
            System.out.println("equalsIgnoreCase: Strings are NOT EQUAL");
        }

        // compareTo() — dictionary order
        int result = a.compareTo(b);
        if (result == 0) {
            System.out.println("compareTo()     : Strings are EQUAL");
        } else if (result < 0) {
            System.out.println("compareTo()     : \"" + a + "\" comes BEFORE \"" + b + "\"");
        } else {
            System.out.println("compareTo()     : \"" + a + "\" comes AFTER  \"" + b + "\"");
        }

        sc.close();
    }
}