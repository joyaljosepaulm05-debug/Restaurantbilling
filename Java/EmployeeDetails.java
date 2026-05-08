class Employee {
    String name;
    int age;

    Employee(String name, int age) {
        this.name = name;
        this.age  = age;
    }

    void display() {
        System.out.println("Employee Name : " + name);
        System.out.println("Employee Age  : " + age);
    }
}

class Manager extends Employee {
    String department;
    double salary;

    Manager(String name, int age, String department, double salary) {
        super(name, age);
        this.department = department;
        this.salary     = salary;
    }

    void display() {
        super.display();
        System.out.println("Department    : " + department);
        System.out.printf("Salary        : Rs. %.2f%n", salary);
    }
}

public class EmployeeDetails {
    public static void main(String[] args) {
        Manager m1 = new Manager("Arjun Kumar", 35, "Engineering", 85000);
        Manager m2 = new Manager("Priya Menon", 29, "Marketing",   72000);

        System.out.println("===== Manager 1 =====");
        m1.display();
        System.out.println("\n===== Manager 2 =====");
        m2.display();
    }
}
