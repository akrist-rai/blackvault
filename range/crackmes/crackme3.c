/* level 3 — keygen. No fixed password: forge a serial that satisfies the algorithm.
   Rules: 8 digits, first digit '4', position-weighted sum (digit*(i+1)) divisible by 17. */
#include <stdio.h>
#include <string.h>
int main(int argc, char **argv){
    if(argc < 2){ printf("usage: %s <serial>\n", argv[0]); return 1; }
    const char *s = argv[1];
    if(strlen(s) != 8){ puts("INVALID"); return 1; }
    int sum = 0;
    for(int i=0;i<8;i++){ if(s[i]<'0'||s[i]>'9'){ puts("INVALID"); return 1; } sum += (s[i]-'0')*(i+1); }
    if(sum % 17 == 0 && s[0]=='4'){ puts("VALID SERIAL"); return 0; }
    puts("INVALID"); return 1;
}
