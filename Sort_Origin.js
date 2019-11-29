                var iter,end;
                var now,dvs,tmp,left,right,wall;
                end=allCounter;
                clearHeap();
                for(iter=1;iter<end;iter++) {    // 다 empty라서 비교해도 뒤로 안밀려남
                    Heap[iter]=allCollege[iter];
                    now=dvs=iter;
                    dvs=parseInt(dvs/2);

                    console.log(Heap[iter].non);

                    while(dvs!=0){
                        if (Heap[now].non < Heap[dvs].non) {    // 아직 안정해져서 non으로 둠. 나중에 때에 맞춰 바꿔야함
                            tmp=Heap[now];
                            Heap[now]=Heap[dvs];
                            Heap[dvs]=tmp;
				            now = dvs;
			            }
			            dvs=parseInt(dvs/2);
                    }
                }
                // 여기까지 위치 잡기
                wall=end-1;
                for(iter=1;iter<end;iter++, wall--){
                    now=1;
                    tmp=Heap[wall];
                    Heap[wall]=Heap[now];
                    Heap[now]=tmp;
                    while (1) {
			            if (now >= wall)break;

			            left = now * 2;
			            right = now * 2 + 1;
			            if (right >= wall)right = 0;
			            if (left >= wall)left = 0;

			            if (Heap[left].non < Heap[right].non && Heap[left].non < Heap[now].non) {       //non
                            tmp=Heap[left];
                            Heap[left]=Heap[now];
                            Heap[now]=tmp;
			    	        now = left;
			            }
			            else if (Heap[left].non > Heap[right].non && Heap[right].non < Heap[now].non) {         //non
                            tmp=Heap[right];
                            Heap[right]=Heap[now];
                            Heap[now]=tmp;
				            now = right;
			            }
			            else break;
		            }
                }
                // fillTable()로 채우기
                fillTable();