#include <stdio.h>
#define SWAP(a,b,t) {t=a;a=b;b=t;}
#define N 20		// 데이터 개수 쓰면 됨

int main(){
	FILE *in = fopen("data.txt", "r");
	FILE *out = fopen("sort.txt", "w");

	int Heap[30];
	int iter, j, n, now, dvs, tmp, end, wall, left, right;
	end = N;
	Heap[0] = 0;
	for (iter = 1; iter <= end; iter++){
		fscanf(in, "%d", &Heap[iter]);
		now = dvs = iter;
		dvs /= 2;
		while (dvs != 0){
			if (Heap[now] > Heap[dvs]) {
				SWAP(Heap[now], Heap[dvs], tmp)
					now = dvs;
				dvs /= 2;
			}
			else break;
		}
	}
	wall = end;
	for (iter = 1; iter<end; iter++, wall--){
		now = 1;
		SWAP(Heap[wall], Heap[now], tmp)
			while (1) {
				if (now >= wall)break;

				left = now * 2;
				right = now * 2 + 1;
				if (right >= wall)right = 0;
				if (left >= wall)left = 0;

				if (Heap[left] >= Heap[right] && Heap[left] > Heap[now]) {
					SWAP(Heap[left], Heap[now], tmp)
						now = left;
				}
				else if (Heap[left] <= Heap[right] && Heap[right] > Heap[now]) {
					SWAP(Heap[right], Heap[now], tmp)
						now = right;
				}
				else break;
			}
	}
	for (iter = 1; iter <= end; iter++)
		fprintf(out, "%d\n", Heap[iter]);

	return 0;
}