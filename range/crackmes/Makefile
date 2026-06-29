# stripped, no-symbol builds so you reverse them like real malware
CFLAGS=-O0 -fno-stack-protector
all: crackme1 crackme2 crackme3
crackme%: crackme%.c
	gcc $(CFLAGS) -o $@ $< && strip $@
clean:
	rm -f crackme1 crackme2 crackme3
