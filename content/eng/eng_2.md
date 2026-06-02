---
id: eng_2
title: 백준 1074번 - Z
date: 2021-07-05
topic: eng
---


<a href="https://www.acmicpc.net/problem/1074">백준 1074번 : Z</a>
<br>
<br>
재귀함수를 이용한 문제를 푸는 코드이다. 아마 이걸 분할정복이라 부르는 듯 하다. 재귀함수를 이용해 범위를 좁히며 누적값을 계산한다.
<be>

```
#include <stdio.h>
int f(int r, int c, int n) {
    int rr, cc;
    rr = r/n, cc = c/n;
    if(!(n-1))
        return (2*rr + cc);
    else
        return n*n*(2*rr + cc) + f(r-rr*n, c-cc*n, n/2);
}
int main() {
    int n, r, c, end = 1;
    int i, j;
    scanf("%d %d %d", &n, &r, &c);
    end = end << n-1;
    printf("%d", f(r, c, end));
    return 0;
}
```