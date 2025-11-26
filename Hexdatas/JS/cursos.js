/*
  arquivo: filtros_comentado.js
  descrição: Script de filtros, busca, animações e funcionalidade "mostrar mais" para os cards de cursos.
  Observação: preservei a lógica original sem alterações funcionais; adicionei comentários explicativos
  em português para facilitar manutenção e entendimento.

  Estrutura esperada no HTML/CSS:
  - botões de filtro: .filter-btn com data-filter="categoria"
  - campo de busca: #search-input
  - botões mostrar mais: .show-more-btn com data-target="<categoria>"
  - containers de cursos: .cursos-container com atributos data-category e opcional data-limit
  - cards: .curso-card com data-categories="cat1,cat2" e conteúdo (h3, .btn-acessar, etc.)
*/

document.addEventListener('DOMContentLoaded', () => {
  // referências iniciais aos elementos usados
  const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
  const searchInput = document.getElementById('search-input');
  const showMoreBtns = Array.from(document.querySelectorAll('.show-more-btn'));
  const containers = Array.from(document.querySelectorAll('.cursos-container'));

  /**
   * Aplica filtro + busca em todos os containers
   * @param {string} filter - categoria selecionada (ex: 'frontend' ou 'all')
   * @param {string} query - termo de busca (já pode vir vazio)
   */
  function applyFilter(filter = 'all', query = '') {
    // normaliza a query para comparação case-insensitive
    const q = (query || '').trim().toLowerCase();

    // percorre todos os containers (cada one pode ter seu próprio data-limit)
    containers.forEach(container => {
      const cards = Array.from(container.querySelectorAll('.curso-card'));
      cards.forEach(card => {
        // pega as categorias do card a partir do atributo data-categories
        const cats = (card.dataset.categories || '').split(',').map(s => s.trim());
        // pega o título para busca (usa h3 interno) e normaliza
        const title = (card.querySelector('h3')?.innerText || '').toLowerCase();
        // verifica se o card corresponde ao filtro e à query
        const matchesFilter = (filter === 'all') || cats.includes(filter);
        const matchesQuery = q === '' || title.includes(q);

        // mostra ou esconde o card conforme as condições
        if (matchesFilter && matchesQuery) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      // após aplicar filtro e busca, aplica o limite (data-limit) ao container
      applyShowLimit(container);
    });
  }

  /**
   * Aplica o limite de exibição por container (data-limit)
   * Esconde os cards que ultrapassam o limite adicionando a classe 'limit-hidden'
   * Também controla a visibilidade do botão "Mostrar mais" correspondente
   */
  function applyShowLimit(container) {
    const limit = parseInt(container.dataset.limit || '999', 10);
    const cards = Array.from(container.querySelectorAll('.curso-card'));
    let visibleCount = 0;

    cards.forEach(card => {
      // se já está escondido pelo filtro, ignora
      if (card.classList.contains('hidden')) return;

      visibleCount++;

      // quando ultrapassar o limite, marca como limit-hidden e esconde
      if (visibleCount > limit) {
        card.classList.add('hidden', 'limit-hidden');
      } else {
        // garante que o card que está dentro do limite não tenha a marca de limit-hidden
        card.classList.remove('limit-hidden');
      }
    });

    // encontra o botão "Mostrar mais" que corresponde a este container via data-target
    const cat = container.dataset.category;
    const btn = document.querySelector(`.show-more-btn[data-target="${cat}"]`);
    if (!btn) return;

    // decide se há algum card escondido apenas por causa do limite
    const anyHiddenByLimit = cards.some(c => c.classList.contains('limit-hidden'));
    btn.style.display = anyHiddenByLimit ? 'inline-flex' : 'none';
    btn.dataset.state = anyHiddenByLimit ? 'more' : 'none';
  }

  // --- 🔥 CORREÇÃO TOTAL DO SCROLL AQUI ---
  // Adiciona evento de clique a cada botão de filtro
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {

      // gerencia classe ativa nos botões (visual)
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      // aplica filtro atual combinando com o texto da busca
      applyFilter(filter, searchInput.value);

      // após filtrar, rola a página para o primeiro card visível
      const firstVisibleCard = document.querySelector('.curso-card:not(.hidden)');

      // calcula offsets para compensar header fixo e a barra de filtros (se houver)
      const header = document.querySelector('.main-header');
      const filters = document.querySelector('.filters-wrapper');

      const headerHeight = header ? header.offsetHeight : 0;
      const filtersHeight = filters ? filters.offsetHeight : 0;

      if (firstVisibleCard) {
        // obtém a posição do primeiro card visível relativa à viewport e converte para posição absoluta
        const rect = firstVisibleCard.getBoundingClientRect();
        const offset = rect.top + window.scrollY - headerHeight - filtersHeight - 15; // 15px de folga

        window.scrollTo({
          top: Math.max(0, offset),
          behavior: "smooth"
        });
      } else {
        // se nenhum card estiver visível (filtro sem resultados), rola até a barra de filtros
        if (filters) {
          const rect = filters.getBoundingClientRect();
          const offset = rect.top + window.scrollY - headerHeight;

          window.scrollTo({
            top: Math.max(0, offset),
            behavior: "smooth"
          });
        }
      }
    });
  });

  // Busca com debounce para evitar execuções excessivas durante digitação
  let debounceTimer = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const activeBtn = document.querySelector('.filter-btn.active');
      const filter = activeBtn ? activeBtn.dataset.filter : 'all';
      applyFilter(filter, e.target.value);
    }, 220); // espera 220ms após o último input
  });

  // Lógica dos botões "Mostrar mais" / "Mostrar menos"
  showMoreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const container = document.querySelector(`.cursos-container[data-category="${target}"]`);
      if (!container) return;

      const cards = Array.from(container.querySelectorAll('.curso-card'));
      const isExpanded = btn.dataset.state === 'expanded';

      if (!isExpanded) {
        // mostra todos os cards (remove esconderijo por limite e por filtro)
        cards.forEach(c => c.classList.remove('limit-hidden', 'hidden'));
        btn.dataset.state = 'expanded';
        btn.textContent = 'Mostrar menos';
      } else {
        // recria o estado de filtro atual para reaplicar limites
        applyFilter(document.querySelector('.filter-btn.active')?.dataset.filter || 'all', searchInput.value);
        btn.dataset.state = 'more';
        btn.textContent = 'Mostrar mais';
      }
    });

    // inicialmente esconde o botão; será mostrado por applyShowLimit quando necessário
    btn.style.display = 'none';
  });

  // aplica limites iniciais (caso containers tenham data-limit)
  containers.forEach(container => applyShowLimit(container));

  // aplica filtro inicial (exibe tudo por padrão)
  applyFilter('all', '');

  // Acessibilidade: ao pressionar Enter no campo de busca, foca o botão "Ver curso" do primeiro card visível
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstVisible = document.querySelector('.curso-card:not(.hidden) .btn-acessar');
      if (firstVisible) firstVisible.focus();
    }
  });
});
