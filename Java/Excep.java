class BankException extends Exception{
    public BankException(String mes) {
        super(mes);
    }
}

class Bank{
    String a;
    int b;
    Bank(String ac,int ba){
        a=ac;
        b=ba;
    }
    void deposit(int i){
        b+=i;
    }
    void withdraw(int o) throws BankException{

if(o>b){
    throw new BankException("INSUFFICIENT AMMOUNT");
}
        b-=o;
    }
    }
public class Excep{
    public static void main(String[] args){
        Bank bb= new Bank("joya",500);
        bb.deposit(400);
        try{
    bb.withdraw(8000);}
    catch(BankException e){
        System.out.println("GOT"+e.getMessage());
    }
    }
    }
