import { USE_CASES } from '../data/usecases.js';
import { io } from './reveal.js';

export function initUsecasesGrid(){
  const usecaseGrid = document.getElementById('usecaseGrid');
  USE_CASES.forEach(u => {
    const card = document.createElement('div');
    card.className = 'usecase-card reveal';
    card.innerHTML = `
      <div class="usecase-icon">${u.icon}</div>
      <h3 style="color:${u.color}">${u.title}</h3>
      <p>${u.desc}</p>
    `;
    usecaseGrid.appendChild(card);
    io.observe(card);
  });
}
