const reportBugBtn = document.getElementById("reportBugBtn");
const buyCoffeeBtn = document.getElementById("buyCoffeeBtn");

buyCoffeeBtn.addEventListener("click", () => {
  window.open("https://buymeacoffee.com/biniyam_tiruye", "_blank");
});

reportBugBtn.addEventListener("click", () => {
  window.open("https://github.com/biniyam-mt/semai/issues", "_blank");
});
