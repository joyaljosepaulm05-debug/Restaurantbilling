class Employee {
    String name;
    double basicSalary;

    Employee(String name, double basicSalary) {
        this.name = name;
        this.basicSalary = basicSalary;
    }

    double calculateSalary() {
        return basicSalary;
    }

    void display() {
        System.out.println("Name        : " + name);
        System.out.println("Basic Salary: " + basicSalary);
    }
}

class Manager extends Employee {
    double bonus;

    Manager(String name, double basicSalary, double bonus) {
        super(name, basicSalary);
        this.bonus = bonus;
    }

    double calculateSalary() {
        return basicSalary + bonus;
    }

    void display() {
        super.display();
        System.out.println("Bonus       : " + bonus);
        System.out.println("Total Salary: " + calculateSalary());
    }
}

class Intern extends Employee {
    double stipend;

    Intern(String name, double basicSalary, double stipend) {
        super(name, basicSalary);
        this.stipend = stipend;
    }

    double calculateSalary() {
        return basicSalary + stipend;
    }

    void display() {
        super.display();
        System.out.println("Stipend     : " + stipend);
        System.out.println("Total Salary: " + calculateSalary());
    }
}

public class EmployeeSalary {
    public static void main(String[] args) {
        Manager m = new Manager("Alice", 50000, 10000);
        Intern i = new Intern("Bob", 15000, 5000);

        System.out.println("--- Manager ---");
        m.display();

        System.out.println("\n--- Intern ---");
        i.display();
    }
}