var test = document.getElementById('test');

function button1(){
            
    alert(test)
}
function button2(){
    var ti = document.getElementById("test");
    ti.value = ti.value + " button2";
}

function buttion(e){
    var a = document.getElementById(e);
    a.innerHTML = a.innerHTML + e;
    alert(a);
    alert(a.innerHTML);
}