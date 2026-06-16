export function initNavbar(){
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  hamburgerBtn.addEventListener('click', () => mobileDrawer.classList.toggle('open'));
  mobileDrawer.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => mobileDrawer.classList.remove('open'))
  );
}
