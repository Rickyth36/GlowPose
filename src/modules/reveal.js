// Shared IntersectionObserver instance — other modules (effects grid, use cases) import
// `io` and call io.observe() on elements they create dynamically.
export const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
}, { threshold: 0.15 });

export function initRevealAnimations(){
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}
