import javax.swing.*;

public class LoginForm {
    public static void main(String[] args) {

        // Frame
        JFrame frame = new JFrame("Login Form");
        frame.setSize(350, 200);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setLayout(null);

        // Username Label
        JLabel userLabel = new JLabel("Username:");
        userLabel.setBounds(50, 30, 80, 25);
        frame.add(userLabel);

        // Username TextField
        JTextField userField = new JTextField();
        userField.setBounds(140, 30, 150, 25);
        frame.add(userField);

        // Password Label
        JLabel passLabel = new JLabel("Password:");
        passLabel.setBounds(50, 70, 80, 25);
        frame.add(passLabel);

        // Password TextField
        JTextField passField = new JTextField();
        passField.setBounds(140, 70, 150, 25);
        frame.add(passField);

        // Login Button
        JButton loginButton = new JButton("Login");
        loginButton.setBounds(120, 110, 100, 30);
        frame.add(loginButton);

        frame.setVisible(true);
    }
}