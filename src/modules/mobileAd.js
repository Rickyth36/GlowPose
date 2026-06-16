export function initMobileAd(){
  const mobileAdBar = document.getElementById('mobileAdBar');
  const mobileAdClose = document.getElementById('mobileAdClose');

  if(window.innerWidth <= 768){ mobileAdBar.classList.add('show'); }

  mobileAdClose.addEventListener('click', () => mobileAdBar.classList.remove('show'));
  window.addEventListener('resize', () => {
    if(window.innerWidth > 768) mobileAdBar.classList.remove('show');
  });
}
