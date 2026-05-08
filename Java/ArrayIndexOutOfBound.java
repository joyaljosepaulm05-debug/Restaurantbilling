public class ArrayIndexOutOfBound{
    public static void main(String[] args) {
        int[] arr = {10, 20, 30, 40, 50};

        System.out.println("Array length: " + arr.length);

        try {
            // Valid access
            System.out.println("arr[2] = " + arr[2]);

            // Invalid access - causes exception
            System.out.println("arr[7] = " + arr[7]);
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("Exception Caught: " + e.getMessage());
        } finally {
            System.out.println("Finally block executed.");
        }
    }
}