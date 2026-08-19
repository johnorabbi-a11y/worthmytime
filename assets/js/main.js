const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector("#site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const currentPath = window.location.pathname.replace(/\/index\.html$/, "/");
document.querySelectorAll(".site-nav a").forEach((link) => {
  const linkPath = new URL(link.href).pathname;
  if (linkPath === currentPath) {
    link.setAttribute("aria-current", "page");
  }
});

document.querySelectorAll("[data-current-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});
