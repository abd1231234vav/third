const accents = [
  ["#d97706", "#9a3412"],
  ["#0f766e", "#115e59"],
  ["#2563eb", "#1d4ed8"],
  ["#be185d", "#9d174d"]
];

const themeButton = document.getElementById("themeButton");
let accentIndex = 0;

themeButton.addEventListener("click", () => {
  accentIndex = (accentIndex + 1) % accents.length;
  const [accent, accentDark] = accents[accentIndex];

  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--accent-dark", accentDark);
  themeButton.textContent = "Accent Updated";

  window.setTimeout(() => {
    themeButton.textContent = "Change Accent";
  }, 900);
});
