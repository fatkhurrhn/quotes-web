const input = document.getElementById("input");
const wrap = document.getElementById("wrap");
input.addEventListener("keyup", function(){
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4 && xhr.status == 200) {
            wrap.innerHTML = xhr.responseText;
        }
    }
    xhr.open("GET", "cari.php?keyword="+input.value, true);
    xhr.send();
});
