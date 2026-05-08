import java.sql.*;
import java.util.Scanner;
public class StudentUserInput {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        Connection con = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/bca24db", "root", "Joyal@2005");
          Statement stmt = con.createStatement();        
 // 🔹 Create table (if not exists)
        String createTable = "CREATE TABLE IF NOT EXISTS testnew (id INT PRIMARY KEY,name VARCHAR(50),marks INT)";
        stmt.executeUpdate(createTable);
        System.out.println("Table ready.\n");     
        String insertSQL = "INSERT INTO testnew VALUES (?, ?, ?)";
        PreparedStatement ps = con.prepareStatement(insertSQL);
        System.out.print("Enter number of students: ");
        int n = sc.nextInt();
        // 🔹 Taking user input
        for (int i = 0; i < n; i++) {
            System.out.println("\nEnter details for student " + (i + 1));
            System.out.print("ID: ");
            int id = sc.nextInt();
            System.out.print("Name: ");
            String name = sc.next();
            System.out.print("Marks: ");
            int marks = sc.nextInt();
            ps.setInt(1, id);
            ps.setString(2, name);
            ps.setInt(3, marks);
            ps.addBatch();  // add to batch   
            }
        // 🔹 Insert all records
        ps.executeBatch();
        System.out.println("\nRecords inserted successfully.\n");
        // 🔹 Display marks > 50
        String selectSQL = "SELECT * FROM testnew WHERE marks > ?";
        PreparedStatement ps2 = con.prepareStatement(selectSQL);
        ps2.setInt(1, 50);
        ResultSet rs = ps2.executeQuery();
        System.out.println("Students with marks > 50:");
        while (rs.next()) {
            System.out.println(
                rs.getInt(1) + " " +
                rs.getString(2) + " " +
                rs.getInt(3));}
        con.close();
        sc.close();
    }
    }