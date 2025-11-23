/* filtros, busca, animações e mostrar mais
   - botão filter: data-filter="analise-dados|frontend|..."
   - cards: data-categories="frontend,core"
   - containers: .cursos-container [data-category="frontend"] [data-limit="6"]
*/

document.addEventListener('DOMContentLoaded', () => {
  const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
  const searchInput = document.getElementById('search-input');
  const showMoreBtns = Array.from(document.querySelectorAll('.show-more-btn'));
  const containers = Array.from(document.querySelectorAll('.cursos-container'));

  // função para atualizar visibilidade dos cursos (aplica filtro + busca)
  function applyFilter(filter = 'all', query = '') {
    // normaliza query
    const q = (query || '').trim().toLowerCase();

    // percorre todos os containers e cards
    containers.forEach(container => {
      const cards = Array.from(container.querySelectorAll('.curso-card'));
      cards.forEach(card => {
        const cats = (card.dataset.categories || '').split(',').map(s => s.trim());
        const title = (card.querySelector('h3')?.innerText || '').toLowerCase();
        const matchesFilter = (filter === 'all') || cats.includes(filter);
        const matchesQuery = q === '' || title.includes(q);

        if (matchesFilter && matchesQuery) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      // aplicar limite após filtragem
      applyShowLimit(container);
    });
  }

  // aplica limite (data-limit) por container
  function applyShowLimit(container) {
    const limit = parseInt(container.dataset.limit || '999', 10);
    const cards = Array.from(container.querySelectorAll('.curso-card'));
    let visibleCount = 0;

    cards.forEach(card => {
      if (card.classList.contains('hidden')) return;

      visibleCount++;

      if (visibleCount > limit) {
        card.classList.add('hidden', 'limit-hidden');
      } else {
        card.classList.remove('limit-hidden');
      }
    });

    const cat = container.dataset.category;
    const btn = document.querySelector(`.show-more-btn[data-target="${cat}"]`);
    if (!btn) return;

    const anyHiddenByLimit = cards.some(c => c.classList.contains('limit-hidden'));
    btn.style.display = anyHiddenByLimit ? 'inline-flex' : 'none';
    btn.dataset.state = anyHiddenByLimit ? 'more' : 'none';
  }

  // --- 🔥 CORREÇÃO TOTAL DO SCROLL AQUI ---
  // Evento nos botões de filtro
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {

      // botão ativo
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      applyFilter(filter, searchInput.value);

      // 🎯 Encontrar o primeiro curso visível para rolar até ele
      const firstVisibleCard = document.querySelector('.curso-card:not(.hidden)');

      const header = document.querySelector('.main-header');
      const filters = document.querySelector('.filters-wrapper');

      const headerHeight = header ? header.offsetHeight : 0;
      const filtersHeight = filters ? filters.offsetHeight : 0;

      if (firstVisibleCard) {
        const rect = firstVisibleCard.getBoundingClientRect();
        const offset = rect.top + window.scrollY - headerHeight - filtersHeight - 15;

        window.scrollTo({
          top: Math.max(0, offset),
          behavior: "smooth"
        });
      } else {
        // Se nada visível, rola até os filtros
        const rect = filters.getBoundingClientRect();
        const offset = rect.top + window.scrollY - headerHeight;

        window.scrollTo({
          top: Math.max(0, offset),
          behavior: "smooth"
        });
      }
    });
  });

  // busca com pequeno debounce
  let debounceTimer = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const activeBtn = document.querySelector('.filter-btn.active');
      const filter = activeBtn ? activeBtn.dataset.filter : 'all';
      applyFilter(filter, e.target.value);
    }, 220);
  });

  // lógica para "Mostrar mais"
  showMoreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const container = document.querySelector(`.cursos-container[data-category="${target}"]`);
      if (!container) return;

      const cards = Array.from(container.querySelectorAll('.curso-card'));
      const isExpanded = btn.dataset.state === 'expanded';

      if (!isExpanded) {
        cards.forEach(c => c.classList.remove('limit-hidden', 'hidden'));
        btn.dataset.state = 'expanded';
        btn.textContent = 'Mostrar menos';
      } else {
        applyFilter(document.querySelector('.filter-btn.active')?.dataset.filter || 'all', searchInput.value);
        btn.dataset.state = 'more';
        btn.textContent = 'Mostrar mais';
      }
    });

    btn.style.display = 'none';
  });

  // aplicar limites iniciais
  containers.forEach(container => applyShowLimit(container));

  // aplicação inicial
  applyFilter('all', '');

  // acessibilidade: Enter foca primeiro curso
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstVisible = document.querySelector('.curso-card:not(.hidden) .btn-acessar');
      if (firstVisible) firstVisible.focus();
    }
  });
});
