const dodgeBtn = document.getElementById('dodge-btn');

// Kiểm tra nếu là thiết bị di động
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function moveButtonRandomly() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const btnWidth = dodgeBtn.offsetWidth;
  const btnHeight = dodgeBtn.offsetHeight;

  const padding = 20; 
  const maxLeft = screenWidth - btnWidth - padding;
  const maxTop = screenHeight - btnHeight - padding;

  const randomLeft = Math.floor(Math.random() * (maxLeft - padding) + padding);
  const randomTop = Math.floor(Math.random() * (maxTop - padding) + padding);

  dodgeBtn.style.position = "fixed";
  dodgeBtn.style.left = `${randomLeft}px`;
  dodgeBtn.style.top = `${randomTop}px`;
  dodgeBtn.style.transform = "none";
}

// Di chuyển khi rê chuột (máy tính)
if (!isMobile) {
  dodgeBtn.addEventListener("mouseenter", moveButtonRandomly);
}

// Di chuyển ngay khi chạm (điện thoại)
dodgeBtn.addEventListener("touchstart", (e) => {
  e.preventDefault(); // ngăn xử lý click
  moveButtonRandomly(); // di chuyển ngay
});

// Chặn click trên mọi thiết bị
dodgeBtn.addEventListener("click", (e) => {
  e.preventDefault(); // ngăn click
  moveButtonRandomly(); // di chuyển ngay
});

// Nút "Cho" vẫn hoạt động bình thường
document.getElementById("link-btn").addEventListener("click", () => {
  window.location.href = "test.html";
});
