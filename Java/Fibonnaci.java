import java.util.Scanner;
public class Fibonnaci{
    public static void main(String[] args){
        System.out.println("Enter Fibonaci");
        Scanner se=new Scanner(System.in);
        int f=se.nextInt();
        int n0=0,n1=1;
        System.out.printf("%d\n%d\n",n0,n1);
        for(int i=0;i<=f;i++){
            int s=n0+n1;
            System.out.println(s);
            n0=n1;
            n1=s;
        }
    }
}