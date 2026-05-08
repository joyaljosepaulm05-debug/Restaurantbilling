import java.util.Scanner;
public class table{
    public static void main(String args[]){
        Scanner s =new Scanner(System.in);
        int n=s.nextInt();
        System.out.println("Multiplication table");
    for(int i=0;i<=10;i++){
        System.out.printf("%d X %d = %d\n",i,n,i*n);
    }
    }
}

