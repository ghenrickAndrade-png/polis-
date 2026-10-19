import { CONCEPTS } from '../content/concepts';
import { state } from './state';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Página imprimível com tudo que o Caderno já tem, agrupado por área/página do livro. */
export function openResumao(): void {
  const el = document.getElementById('resumao');
  if (!el) return;
  const unlocked = CONCEPTS.filter((c) => state.journal.has(c.id));
  const areas = [...new Set(unlocked.map((c) => c.area))];
  const canPrint = window.top === window; // dentro do app o diálogo de impressão não abre
  let html = `<div class="bar"><button id="res-copy">Copiar texto</button>${canPrint ? '<button id="res-print">Imprimir / salvar em PDF</button>' : ''}<button id="res-close">Voltar ao jogo</button><span id="res-msg" class="meta"></span></div>`;
  html += `<h1>Resumão de Pólis</h1><p class="meta">${esc(state.name === '???' ? 'Estudante' : state.name)} · ${unlocked.length} de ${CONCEPTS.length} páginas do Caderno · ${new Date().toLocaleDateString('pt-BR')}</p>`;
  if (!unlocked.length) html += `<p>Nenhuma página ainda. Jogue um templo e volte aqui.</p>`;
  for (const area of areas) {
    html += `<h2>${esc(area)}</h2>`;
    for (const c of unlocked.filter((x) => x.area === area)) {
      const e = state.journal.get(c.id)!;
      html += `<h3>${esc(c.title)} <span class="meta">(${esc(c.page)})</span></h3>`;
      html += `<p><b>No livro.</b> ${esc(c.book)}</p>`;
      if (e.did.length) html += `<p><b>O que eu fiz no jogo.</b> ${e.did.map(esc).join(' ')}</p>`;
      if (e.mine) html += `<p><b>Com as minhas palavras.</b> ${esc(e.mine)}</p>`;
    }
  }
  el.innerHTML = html;
  el.classList.add('open');
  const msg = document.getElementById('res-msg');
  document.getElementById('res-print')?.addEventListener('click', () => window.print());
  document.getElementById('res-close')?.addEventListener('click', () => el.classList.remove('open'));
  document.getElementById('res-copy')?.addEventListener('click', () => {
    const text = plainText(unlocked);
    const done = () => {
      if (msg) msg.textContent = 'Copiado. Cole num documento para imprimir.';
    };
    const fallback = () => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      if (msg) msg.textContent = 'Texto selecionado: use Ctrl+C / Cmd+C.';
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
    else fallback();
  });
}

function plainText(unlocked: typeof CONCEPTS): string {
  const lines: string[] = ['RESUMÃO DE PÓLIS', ''];
  for (const area of [...new Set(unlocked.map((c) => c.area))]) {
    lines.push(area.toUpperCase());
    for (const c of unlocked.filter((x) => x.area === area)) {
      const e = state.journal.get(c.id)!;
      lines.push(`\n${c.title} (${c.page})`);
      lines.push(`No livro: ${c.book}`);
      if (e.did.length) lines.push(`O que eu fiz no jogo: ${e.did.join(' ')}`);
      if (e.mine) lines.push(`Com as minhas palavras: ${e.mine}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
