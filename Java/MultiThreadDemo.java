// Even Thread
class EvenThread extends Thread {
    public void run() {
        for (int i = 2; i <= 10; i += 2) {
            System.out.println("Even Thread : " + i);
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                System.out.println("Even Thread interrupted.");
            }
        }
    }
}

// Odd Thread
class OddThread extends Thread {
    public void run() {
        for (int i = 1; i <= 10; i += 2) {
            System.out.println("Odd Thread  : " + i);
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                System.out.println("Odd Thread interrupted.");
            }
        }
    }
}

// Main Class
public class MultiThreadDemo {
    public static void main(String[] args) {
        EvenThread even = new EvenThread();
        OddThread  odd  = new OddThread();

        System.out.println("===== Multithreading Demo =====");

        even.start(); // starts even thread
        odd.start();  // starts odd thread
    }
}