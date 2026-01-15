// script.js — readable implementation supporting mouse, keyboard, and touch
const state = {
  tiles: [],
  selectedIndex: 0
};

async function loadProject() {
  try {
    const res = await fetch('project.json');
    if (!res.ok) throw new Error('project.json not found');
    const proj = await res.json();
    state.tiles = proj.tiles || [];
    renderMenu();
    attachInputHandlers();
  } catch (err) {
    console.error('Failed to load project.json', err);
    document.getElementById('menu').textContent = 'Failed to load project.json. See README.';
  }
}

function renderMenu() {
  const menu = document.getElementById('menu');
  menu.innerHTML = '';
  state.tiles.forEach((t, i) => {
    const el = document.createElement('button');
    el.className = 'tile';
    el.setAttribute('aria-label', t.label || `tile-${i}`);
    el.setAttribute('data-index', i);
    el.tabIndex = 0;

    const img = document.createElement('img');
    img.src = t.asset ? `assets/${t.asset}` : 'assets/placeholder.svg';
    img.alt = t.label || '';

    const lbl = document.createElement('div');
    lbl.className = 'label';
    lbl.textContent = t.label || '';

    el.appendChild(img);
    el.appendChild(lbl);

    el.addEventListener('click', () => activateTile(i));
    el.addEventListener('touchstart', (e) => { e.preventDefault(); activateTile(i); }, {passive:false});

    menu.appendChild(el);
  });
  updateSelection();
}

function updateSelection() {
  const tiles = document.querySelectorAll('.tile');
  tiles.forEach((el, idx) => {
    el.classList.toggle('selected', idx === state.selectedIndex);
  });
  // Ensure focused element is visible for keyboard users
  const current = tiles[state.selectedIndex];
  if (current) current.focus({preventScroll:true});
}

function clampIndex(idx) {
  if (!state.tiles.length) return 0;
  const n = state.tiles.length;
  if (idx < 0) return 0;
  if (idx >= n) return n - 1;
  return idx;
}

function activateTile(i) {
  state.selectedIndex = clampIndex(i);
  updateSelection();
  const tile = state.tiles[state.selectedIndex];
  if (tile && tile.action) {
    // For now, actions are simple: alert or open url
    if (tile.action.type === 'open') {
      window.open(tile.action.target, '_blank');
    } else if (tile.action.type === 'alert') {
      alert(tile.action.message || `Activated: ${tile.label}`);
    }
  } else {
    alert(`Activated: ${tile.label || 'tile'}`);
  }
}

function attachInputHandlers() {
  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    const cols = computeColumns();
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape'].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === 'ArrowLeft') {
      state.selectedIndex = clampIndex(state.selectedIndex - 1);
      updateSelection();
      playMoveSound();
    } else if (e.key === 'ArrowRight') {
      state.selectedIndex = clampIndex(state.selectedIndex + 1);
      updateSelection();
      playMoveSound();
    } else if (e.key === 'ArrowUp') {
      state.selectedIndex = clampIndex(state.selectedIndex - cols);
      updateSelection();
      playMoveSound();
    } else if (e.key === 'ArrowDown') {
      state.selectedIndex = clampIndex(state.selectedIndex + cols);
      updateSelection();
      playMoveSound();
    } else if (e.key === 'Enter') {
      playSelectSound();
      activateTile(state.selectedIndex);
    } else if (e.key === 'Escape') {
      // simple behavior: deselect
      state.selectedIndex = 0;
      updateSelection();
    }
  });

  // Mouse hover selection
  document.getElementById('menu').addEventListener('mousemove', (e) => {
    const tile = e.target.closest('.tile');
    if (tile) {
      const idx = Number(tile.dataset.index);
      if (!Number.isNaN(idx)) {
        state.selectedIndex = idx;
        updateSelection();
      }
    }
  });
}

function computeColumns() {
  // Compute visible columns from CSS variable / layout
  const menu = document.getElementById('menu');
  const style = window.getComputedStyle(menu);
  const gridTemplate = style.gridTemplateColumns || '';
  if (gridTemplate.includes(' ')) {
    return gridTemplate.split(' ').length;
  }
  // fallback: estimate by tile width
  const tile = document.querySelector('.tile');
  if (!tile) return 4;
  const menuWidth = menu.clientWidth;
  const tileW = tile.clientWidth + parseInt(getComputedStyle(menu).gap || 20, 10);
  return Math.max(1, Math.floor(menuWidth / tileW));
}

function playSelectSound(){
  const audio = document.getElementById('audio-select');
  if (audio) { audio.currentTime = 0; audio.play().catch(()=>{}); }
}
function playMoveSound(){
  const audio = document.getElementById('audio-move');
  if (audio) { audio.currentTime = 0; audio.play().catch(()=>{}); }
}

// Create audio elements if files exist
function initAudio(){
  const sel = document.createElement('audio');
  sel.id = 'audio-select';
  sel.src = 'assets/select.mp3';
  sel.preload = 'auto';
  sel.style.display = 'none';
  document.body.appendChild(sel);

  const mv = document.createElement('audio');
  mv.id = 'audio-move';
  mv.src = 'assets/move.mp3';
  mv.preload = 'auto';
  mv.style.display = 'none';
  document.body.appendChild(mv);
}

// Start
initAudio();
loadProject();
