const dodgeBtn = document.getElementById('dodge-btn');

function moveButtonRandomly() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const btnWidth = dodgeBtn.offsetWidth;
  const btnHeight = dodgeBtn.offsetHeight;

  // Giữ nút trong phạm vi màn hình
  const padding = 20; // cách mép 20px cho đẹp
  const maxLeft = screenWidth - btnWidth - padding;
  const maxTop = screenHeight - btnHeight - padding;

  const randomLeft = Math.floor(Math.random() * (maxLeft - padding) + padding);
  const randomTop = Math.floor(Math.random() * (maxTop - padding) + padding);

  dodgeBtn.style.position = "fixed"; // đảm bảo tính theo màn hình
  dodgeBtn.style.left = `${randomLeft}px`;
  dodgeBtn.style.top = `${randomTop}px`;
  dodgeBtn.style.transform = "none"; 
}

dodgeBtn.addEventListener("mouseenter", moveButtonRandomly);

dodgeBtn.addEventListener("click", () => {
  alert("😆 Bạn giỏi quá, bắt được tui rồi!");
});

document.getElementById("link-btn").addEventListener("click", () => {
  window.location.href = "test.html";
});
