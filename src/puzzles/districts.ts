import Phaser from 'phaser';
import { FONT, GAME_W, TEXT_RES } from '../config';
import { ACTION_INFO, CAUSES, DISTRICTS } from '../content/districtsData';
import type { Dialogue } from '../content/types';
import { bus } from '../engine/bus';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { ACTIONS, DistrictSim, Report, WEEKS, narrateDistricts, type Action } from '../logic/Districts';
import type { RoomScene } from '../scenes/RoomScene';
import { registerController, type Interactable, type RoomController } from './registry';

type Phase = 'ler' | 'onda' | 'relatorio' | 'done';
const ICON: Record<Action, string> = { testes: 'T', leitos: 'L', vacina: 'V' };
/** ordem das causas no menu: dados e senso comum misturados */
const CAUSE_ORDER = ['transporte', 'descuido', 'casas', 'virus', 'plano', 'renda', 'arvores', 'trabalho'];

class Distritos implements RoomController {
  private sim = new DistrictSim(DISTRICTS);
  private report = new Report(CAUSES);
  private phase: Phase = 'ler';
  private read = new Set<string>();
  private hud!: Phaser.GameObjects.Text;
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private weekly: Record<string, { casos: number; mortes: number }> = {};
  constructor(private s: RoomScene) {}

  create(): void {
    this.hud = this.s.add
      .text(GAME_W / 2, 8, '', { fontFamily: FONT, fontSize: '8px', color: '#ffffff', backgroundColor: '#1a1a22cc', padding: { x: 4, y: 2 } })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setResolution(TEXT_RES)
      .setDepth(45000);
    for (const d of DISTRICTS) {
      const img = this.s.props.get(`dist:${d.id}`)!;
      const t = this.s.add
        .text(img.x, img.y + 2, '', { fontFamily: FONT, fontSize: '7px', color: '#ffffff', align: 'center', backgroundColor: d.periferia ? '#4a3a2acc' : '#2a3a5acc', padding: { x: 3, y: 2 } })
        .setOrigin(0.5, 0)
        .setResolution(TEXT_RES)
        .setDepth(20000);
      this.labels.set(d.id, t);
    }
    if (state.has('dist.done')) this.phase = 'done';
    else if (state.has('dist.read')) {
      for (const d of DISTRICTS) this.read.add(d.id);
      this.phase = 'onda';
    }
    this.refresh();
    if (!state.has('dist.intro')) this.s.time.delayedCall(400, () => this.s.dialogue('dist_intro', () => state.set('dist.intro')));
    else if (this.phase === 'onda') bus.emit('hint', 'A mesa reiniciou: semana 1, duas ações do SUS. Coloque-as pelas placas; avance no painel.');
  }

  // ---------------------------------------------------------------- vista
  private refresh(): void {
    for (const d of DISTRICTS) {
      const l = this.labels.get(d.id)!;
      if (this.phase === 'ler') l.setText(`${d.name}\n${this.read.has(d.id) ? 'ficha lida ✓' : 'ler a ficha'}`);
      else {
        const acts = ACTIONS.filter((a) => this.sim.st.get(d.id)!.actions.has(a)).map((a) => ICON[a]).join(' ');
        const w = this.weekly[d.id];
        const nova = w && this.sim.week > 0 ? ` (+${w.mortes})` : '';
        l.setText(`${d.name}\ncasos ${this.sim.casos(d.id)} · mortes ${this.sim.mortes(d.id)}${nova}${acts ? `\nSUS: ${acts}` : ''}`);
      }
    }
    const r = this.sim.resumo();
    if (this.phase === 'ler') this.hud.setText(`Leia as fichas dos distritos: ${this.read.size}/${DISTRICTS.length}`);
    else if (this.phase === 'onda' && !this.sim.finished) this.hud.setText(`Semana ${this.sim.week + 1}/${WEEKS} · ações do SUS: ${this.sim.actionsLeft} · mortes/100 mil: periferia ${r.periferia} · centro ${r.centro}`);
    else if (this.phase === 'onda') this.hud.setText(`Onda encerrada · periferia ${r.periferia} · centro ${r.centro} · feche o relatório no painel`);
    else if (this.phase === 'relatorio') this.hud.setText(`Relatório: ${this.report.chosen.length}/${this.report.needed} causas`);
    else this.hud.setText('Relatório no Caderno · saia e volte para rodar a onda de novo');
  }

  // ------------------------------------------------------------ interação
  onInteract(t: Interactable): boolean {
    if (t.id.startsWith('dist:')) {
      this.district(t.id.slice(5));
      return true;
    }
    if (t.id === 'painel') {
      this.painel();
      return true;
    }
    if (t.id === 'agente') {
      const npc = this.s.npcs.get('agente')!;
      const unpause = () => (npc.paused = false);
      const id = this.phase === 'ler' ? 'dist_agent_read' : this.phase === 'onda' ? (this.sim.finished ? 'dist_agent_finished' : 'dist_agent_wave') : this.phase === 'relatorio' ? 'dist_report_prova' : 'dist_agent_done';
      this.s.dialogue(id, unpause);
      return true;
    }
    return false;
  }

  private district(id: string): void {
    const d = DISTRICTS.find((x) => x.id === id)!;
    if (this.phase === 'ler') {
      const first = !this.read.has(id);
      this.read.add(id);
      sfx.thread();
      this.refresh();
      this.s.say(undefined, d.ficha, () => {
        if (first && this.read.size === DISTRICTS.length) {
          state.set('dist.read');
          state.unlockPage('sus', 'Li as fichas dos seis distritos: no Centro, casas com 2 moradores, home office e plano de saúde; na periferia (Sapopemba, Brasilândia, Grajaú, Jardim Ângela, Capão Redondo), casas cheias, transporte lotado, trabalho presencial e quase ninguém com plano.');
          this.phase = 'onda';
          this.refresh();
          this.s.dialogue('dist_read_done', () => state.save());
        }
      });
      return;
    }
    if (this.phase === 'onda') {
      if (this.sim.finished) return this.s.dialogue('dist_wave_over');
      const st = this.sim.st.get(id)!;
      const steps: Dialogue = [
        { text: `${d.name} (${d.zona}): casos ${this.sim.casos(id)}, mortes ${this.sim.mortes(id)} por 100 mil. Ações do SUS nesta semana: ${this.sim.actionsLeft}.` },
        {
          choice: 'Colocar aqui:',
          options: [
            ...ACTIONS.filter((a) => !st.actions.has(a)).map((a) => ({ label: `${ACTION_INFO[a].label} — ${ACTION_INFO[a].effect}`, event: `act:${id}:${a}` })),
            { label: 'Só olhar a ficha de novo', event: `ficha:${id}` },
          ],
        },
      ];
      bus.emit('dialogue:start', steps);
      return;
    }
    // relatório / done: a ficha continua disponível
    this.s.say(undefined, d.ficha);
  }

  private painel(): void {
    if (this.phase === 'ler') return this.s.say(undefined, `(Painel da onda. Antes de começar, leia os seis distritos: ${this.read.size}/${DISTRICTS.length}.)`);
    if (this.phase === 'onda' && !this.sim.finished) {
      const steps: Dialogue = [
        { text: `(Painel. Semana ${this.sim.week + 1} de ${WEEKS}. Ações do SUS ainda não usadas nesta semana: ${this.sim.actionsLeft}.)` },
        {
          choice: 'O que fazer?',
          options: [
            { label: this.sim.actionsLeft > 0 ? `Avançar a semana (perde ${this.sim.actionsLeft} ação(ões))` : 'Avançar a semana', event: 'painel:tick' },
            { label: 'Ver os números por distrito', event: 'painel:numeros' },
            { label: 'Voltar' },
          ],
        },
      ];
      bus.emit('dialogue:start', steps);
      return;
    }
    if (this.phase === 'onda') return this.showReport();
    if (this.phase === 'relatorio') return this.askCause();
    this.numbers();
  }

  private numbers(done?: () => void): void {
    const alt = this.sim.finished ? this.sim.counterfactual() : null;
    const lines = [
      alt ? '(Mortes por 100 mil — com SUS → se não houvesse SUS:)' : '(Mortes por 100 mil até agora:)',
      ...this.sim.ranking().map((r) => `${r.name}: ${r.mortes}${alt ? ` → ${alt.mortes(r.id)}` : ''}`),
    ];
    if (alt) {
      const a = this.sim.resumo();
      const b = alt.resumo();
      lines.push(`(Periferia ${a.periferia} → ${b.periferia}. Centro ${a.centro} → ${b.centro}. Sem SUS, quem não tem plano fica sem cuidado: a diferença cresce.)`);
    }
    this.s.say(undefined, lines, done);
  }

  onEvent(name: string): void {
    const [kind, a, b] = name.split(':');
    if (kind === 'ficha') return this.s.say(undefined, DISTRICTS.find((x) => x.id === a)!.ficha);
    if (kind === 'act') {
      const d = DISTRICTS.find((x) => x.id === a)!;
      const r = this.sim.act(a, b as Action);
      if (r === 'ok') {
        sfx.thread();
        this.refresh();
        const left = this.sim.actionsLeft;
        this.s.say(undefined, `(${ACTION_INFO[b as Action].label} em ${d.name}: ${ACTION_INFO[b as Action].effect}. ${left > 0 ? `Ainda há ${left} ação nesta semana.` : 'Ações da semana usadas: avance no painel.'})`);
      } else if (r === 'no-actions') this.s.dialogue('dist_no_actions');
      else if (r === 'already') this.s.dialogue('dist_already');
      else this.s.dialogue('dist_wave_over');
      return;
    }
    if (kind === 'painel') {
      if (a === 'numeros') return this.numbers();
      if (a === 'tick') return this.tick();
      return;
    }
    if (kind === 'cause') {
      const r = this.report.pick(a);
      if (r === 'wrong') {
        sfx.fray();
        this.s.shake(120, 0.003);
        this.s.dialogue('dist_cause_wrong', () => this.askCause());
      } else if (r === 'ok') {
        sfx.thread();
        this.refresh();
        bus.emit('toast', `Relatório: ${this.report.chosen.length}/${this.report.needed} causas anotadas`, 'info');
        if (this.report.complete) this.finish();
        else this.askCause();
      }
    }
  }

  private tick(): void {
    this.weekly = this.sim.tick();
    sfx.hit();
    this.s.shake(200, 0.003);
    this.refresh();
    const worst = this.sim.ranking()[0];
    const r = this.sim.resumo();
    const lines = [`(Semana ${this.sim.week} passou. Mortes novas: ${DISTRICTS.map((d) => `${d.name} +${this.weekly[d.id]?.mortes ?? 0}`).join(', ')}.)`];
    if (this.sim.finished) {
      lines.push(`(A onda acabou. ${worst.name} foi o distrito com mais mortes: ${worst.mortes} por 100 mil. Periferia ${r.periferia}, centro ${r.centro}.)`);
      state.addDid('sus', `Rodei a onda de 6 semanas na Mesa da Cidade com ${this.sim.alocacao().periferia} ações do SUS na periferia e ${this.sim.alocacao().centro} no centro: terminou com ${r.periferia} mortes por 100 mil na periferia e ${r.centro} no centro.`);
      this.s.say(undefined, lines, () => bus.emit('hint', 'Volte ao painel para fechar o relatório.'));
    } else this.s.say(undefined, lines);
  }

  private showReport(): void {
    this.s.dialogue('dist_report_intro', () =>
      this.numbers(() => {
        const alt = this.sim.counterfactual().resumo();
        state.addDid('sus', `Vi o contrafactual "e se não houvesse SUS": a periferia teria ${alt.periferia} mortes por 100 mil (contra ${this.sim.resumo().periferia} com SUS) e o centro ${alt.centro}.`);
        this.phase = 'relatorio';
        this.refresh();
        this.s.dialogue('dist_report_prova', () => this.askCause());
      }),
    );
  }

  private askCause(): void {
    const remaining = this.report.remaining();
    const ordered = CAUSE_ORDER.map((id) => remaining.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c);
    const steps: Dialogue = [
      { text: `Causa ${this.report.chosen.length + 1} de ${this.report.needed}: por que a periferia morreu mais que o centro?` },
      { choice: 'Escolha uma causa que esteja nas fichas:', options: ordered.map((c) => ({ label: c.text, event: `cause:${c.id}` })) },
    ];
    bus.emit('dialogue:start', steps);
  }

  private finish(): void {
    const text = narrateDistricts(this.sim, this.report);
    this.s.dialogue('dist_report_pre', () => {
      this.s.say('Agente de Saúde', text, () => {
        state.setMine('sus', text);
        state.set('dist.done');
        this.phase = 'done';
        this.refresh();
        sfx.success();
        this.s.dialogue('dist_report_post', () => state.save());
      });
    });
  }

  update(): void {
    /* nada por frame */
  }
  destroy(): void {
    this.hud.destroy();
    for (const l of this.labels.values()) l.destroy();
  }
}
registerController('distritos', (s) => new Distritos(s));
