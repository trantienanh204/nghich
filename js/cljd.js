const text = "ÔI NGƯỜI TỐT, CẢM ƠN NHÁ 💖💖💖";
let index = 0;

function typeEffect() {
  if (index < text.length) {
    document.getElementById("text").innerHTML += text.charAt(index);
    index++;
    setTimeout(typeEffect, 100);
  } else {
    document.getElementById("cursor").style.display = "none";
  }
}

window.onload = typeEffect;
