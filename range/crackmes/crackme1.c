/* level 1 — plaintext compare. Recover the password with: strings ./crackme1  (or read .rodata in radare2) */
#include <stdio.h>
#include <string.h>
int main(int argc, char **argv){
    if(argc < 2){ printf("usage: %s <password>\n", argv[0]); return 1; }
    if(strcmp(argv[1], "letmein") == 0){ puts("ACCESS GRANTED"); return 0; }
    puts("ACCESS DENIED"); return 1;
}
