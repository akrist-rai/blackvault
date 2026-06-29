/* gdb ./trace ; break compute ; run ; stepi ; info registers rax
   returns 60  ->  echo $? after running shows 60 */
int compute(void){ int rax=5, rbx=3; rax+=rbx; rax*=rax; rax-=4; return rax; }
int main(void){ return compute(); }
