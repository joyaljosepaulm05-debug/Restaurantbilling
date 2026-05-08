import java.sql.*;
public class PreparedStatementExample {
    public static void main(String[] args) {
       // Use 'localhost' for your own Mac
String url = "jdbc:mysql://localhost:3306/bca24db";
// Use 'root' unless you created a specific 'bca24' user
String user = "root";
// Put your actual MySQL password here (or "" if blank)
String password = "Joyal@2005";
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection(url, user, password);
             // 3️⃣ CREATE TABLE
            String createTable = "CREATE TABLE IF NOT EXISTS student_bca (" +
                                 "id INT PRIMARY KEY, " +
                                 "name VARCHAR(50), " +
                                 "marks INT)";
            Statement stmt = con.createStatement();
            stmt.executeUpdate(createTable);
            System.out.println("Table created successfully.");
           
 String sql = "INSERT INTO student_bca (id, name, marks) VALUES (?, ?, ?)";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setInt(1, 101);						
            ps.setString(2, "Rahul");
            ps.setInt(3, 85);
   int rows = ps.executeUpdate();
            System.out.println(rows + " record inserted.");
            con.close();

        } 
catch (Exception e) {
            System.out.println(e);        }    } }
