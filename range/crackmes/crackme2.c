/* level 2 — XOR gate. Each byte is XORed with 0x33 then compared to a key table.
   XOR is its own inverse:  password[i] = key[i] ^ 0x33. */
#include <stdio.h>
#include <string.h>
int main(int argc, char **argv){
    unsigned char key[6] = {0x43,0x44,0x5d,0x52,0x54,0x56};
    if(argc < 2){ printf("usage: %s <password>\n", argv[0]); return 1; }
    const char *s = argv[1];
    if(strlen(s) != 6){ puts("ACCESS DENIED"); return 1; }
    for(int i=0;i<6;i++) if(((unsigned char)s[i]^0x33) != key[i]){ puts("ACCESS DENIED"); return 1; }
    puts("ACCESS GRANTED"); return 0;
}
