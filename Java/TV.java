interface SmartDevice {
    void turnOn();
    void turnOff();
}

class Mobile implements SmartDevice {
    @Override
    public void turnOn() {
        System.out.println("Mobile ON");
    }

    @Override
    public void turnOff() {
        System.out.println("Mobile OFF");
    }
}

class SmartWatch implements SmartDevice {
    @Override
    public void turnOn() {
        System.out.println("Watch ON");
    }

    @Override
    public void turnOff() {
        System.out.println("Watch OFF");
    }
}

public class TV implements SmartDevice {
    @Override
    public void turnOn() {
        System.out.println("TV ON");
    }

    @Override
    public void turnOff() {
        System.out.println("TV OFF");
    }

    public static void main(String args[]) {
        // Polymorphism in action: 
        // Using the Interface type to hold different Object types
        SmartDevice m = new Mobile();
        SmartDevice w = new SmartWatch();
        SmartDevice t = new TV();

        System.out.println("--- Powering Up ---");
        m.turnOn();
        w.turnOn();
        t.turnOn();

        System.out.println("\n--- Powering Down ---");
        m.turnOff();
        w.turnOff();
        t.turnOff();
    }
}