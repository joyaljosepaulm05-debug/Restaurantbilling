public class CharacterFrequency {
    public static void main(String[] args) {
        String text = "hello world";
        int[] freq = new int[256]; // ASCII size

        // Count frequency
        for (int i = 0; i < text.length(); i++) {
            freq[text.charAt(i)]++;
        }

        // Print results
        for (int i = 0; i < 256; i++) {
            if (freq[i] > 0) {
                System.out.println("'" + (char) i + "': " + freq[i]);
            }
        }
    }
}