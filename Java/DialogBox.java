import javax.swing.*;

public class DialogBox {
    public static void main(String[] args) {

        // Frame
        JFrame frame = new JFrame("Dialog Box");
        frame.setSize(300, 200);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        // Panel
        JPanel panel = new JPanel();

        // Button
        JButton button = new JButton("Click Me");
        panel.add(button);

        // Button Action
        button.addActionListener(e -> {
            JOptionPane.showMessageDialog(frame, "Hello User");
        });

        frame.add(panel);
        frame.setVisible(true);
    }
}