import os
from colorama import Fore, Style, init

def run_demo():
    # --- METHOD 1: THE "DEFAULT" MANUAL WAY ---
    # This uses standard ANSI escape sequences. 
    # On many Windows terminals, this might show up as text like \033[92m 
    # instead of changing the color.
    print("--- Method 1: Manual ANSI Codes ---")
    print("\033[92mThis is Green (if it works)\033[0m")
    print("\033[91mThis is Red (if it works)\033[0m")
    print("\033[0mBack to normal.")
    print("\n" + "-"*30 + "\n")

    # --- METHOD 2: THE SUGGESTED WAY (COLORAMA) ---
    # init() checks your OS. If you're on Windows, it "wraps" the terminal
    # so that it understands the codes correctly.
    init(autoreset=True)

    print("--- Method 2: Colorama (Suggested) ---")
    print(Fore.GREEN + "This is definitely Green.")
    print(Fore.RED + "This is definitely Red.")
    print(Style.BRIGHT + Fore.CYAN + "This is Bright Cyan.")

if __name__ == "__main__":
    run_demo()