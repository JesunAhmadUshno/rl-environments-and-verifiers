import { useMemo, useState, useEffect, useCallback, useId } from 'react';
import learn from '../../level-1-learn/results_learn.json';
import build from '../../level-2-build/results_build.json';
import deep from '../../level-3-deep/results_deep.json';
import seeds from '../../level-3-deep/results_seeds.json';
import curves from '../../level-3-deep/results_deep_curves.json';
import roadmapMd from '../../ROADMAP.md?raw';
import readmeMd from '../../README.md?raw';
import * as rl from './rl.js';

const REPO = 'https://github.com/JesunAhmadUshno/rl-environments-and-verifiers';
const blob = (p) => `${REPO}/blob/main/${p}`;
const HASHES = __HASHES__; // eslint-disable-line no-undef
const TESTS = __TESTS__; // eslint-disable-line no-undef
const f3 = (x) => (Math.round(x * 1000) / 1000).toString();
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
// order-independent deep equality (the results files store keys sorted, the port does not)
const canon = (x) => (Array.isArray(x) ? x.map(canon) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, canon(x[k])])) : x);
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const envOf = (task) => build.environments.find((e) => e.task === task);
const deepOf = (task) => deep.tasks.find((t) => t.task === task);
const EVAL_N = deep.evaluation.seeds.length * deep.evaluation.episodes_per_seed;
const GROUP_N = deep.tasks[0].train.group_size;
const L = rl.TASK_LABEL;

const SECTIONS = [['top', 'Overview', '◎'], ['envs', 'Environments', '▦'], ['verifier', 'Verifier', '✓'], ['hacks', 'Post-mortems', '⚑'],
  ['planning', 'Planning', '⌗'], ['trainer', 'Trainer', '▶'], ['results', 'Results', '▥'], ['ablations', 'Ablations', '⇄'],
  ['seeds', 'Seeds', '∿'], ['limits', 'Limits', '!'], ['reproduce', 'Reproduce', '❯_']];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function MenuBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return (
    <div className="menubar" role="banner">
      <span className="apple" aria-hidden="true">◆</span>
      <a className="app" href="#top">RL Verifiers Lab</a>
      <a className="m" href={blob('level-1-learn/README.md')}>Learn</a>
      <a className="m" href={blob('level-2-build/README.md')}>Build</a>
      <a className="m" href={blob('level-3-deep/README.md')}>Deep</a>
      <a className="m" href={blob('docs/research-review.md')}>Review</a>
      <span className="spacer" />
      <span className="status"><i /> Python parity checked at build</span>
      <a href={REPO}>GitHub ↗</a>
      <span className="clock">{now.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
    </div>
  );
}

function Dock() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="dock" aria-label="Sections">
      {SECTIONS.map(([id, label, icon]) => (
        <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>
          <span className="ico" aria-hidden="true">{icon}</span><span className="lbl">{label}</span>
        </a>
      ))}
    </nav>
  );
}

function Range({ label, value, min, max, step, onChange, show }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label} <span>{show}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  const id = useId();
  return (
    <div className="field"><label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </div>
  );
}

function Seg({ label, value, onChange, options }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([k, l]) => <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>)}
    </div>
  );
}

// ------------------------------------------------------------ grid drawing
function GridSVG({ sp, path, path2, values, label, onCell, cell = 52, mark }) {
  const W = sp.cols * cell + 2, H = sp.rows * cell + 2;
  const has = (list, r, c) => list.some((s) => s[0] === r && s[1] === c);
  const vals = values ? Object.values(values) : [];
  const vmin = Math.min(...vals), vmax = Math.max(...vals);
  const cx = (s) => 1 + s[1] * cell + cell / 2, cy = (s) => 1 + s[0] * cell + cell / 2;
  const pts = (p, off) => p.map((s) => `${cx(s) + off},${cy(s) + off}`).join(' ');
  return (
    <svg className="chart grid-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ maxWidth: W * 1.25 }}>
      {Array.from({ length: sp.rows }, (_, r) => Array.from({ length: sp.cols }, (_, c) => {
        const wall = has(sp.walls, r, c), bad = has(sp.bad, r, c), goal = sp.goal[0] === r && sp.goal[1] === c, start = sp.start[0] === r && sp.start[1] === c;
        const v = values?.[`${r},${c}`];
        const heat = v !== undefined && vmax > vmin ? (v - vmin) / (vmax - vmin) : 0;
        return (
          <g key={`${r}-${c}`} onClick={onCell && !wall ? () => onCell([r, c]) : undefined} style={onCell && !wall ? { cursor: 'pointer' } : undefined}>
            <rect x={1 + c * cell} y={1 + r * cell} width={cell} height={cell} rx="6"
              fill={wall ? 'var(--text)' : bad ? 'var(--bad)' : goal ? 'var(--good)' : 'var(--primary)'}
              fillOpacity={wall ? 0.75 : bad ? 0.22 : goal ? 0.22 : values ? 0.05 + 0.45 * heat : 0.04}
              stroke="var(--border)" />
            {mark && mark[0] === r && mark[1] === c && <rect x={3 + c * cell} y={3 + r * cell} width={cell - 4} height={cell - 4} rx="5" fill="none" stroke="var(--warn)" strokeWidth="2.5" />}
            {wall ? <text x={1 + c * cell + cell / 2} y={1 + r * cell + cell / 2 + 4} textAnchor="middle" style={{ fontWeight: 700, fill: 'var(--bg)' }}>wall</text>
              : <text x={1 + c * cell + 6} y={1 + r * cell + 14} className="cell-t">{start ? 'S' : goal ? 'G' : bad ? sp.badName : ''}</text>}
            {v !== undefined && !wall && <text x={1 + c * cell + cell - 6} y={1 + r * cell + cell - 7} textAnchor="end" className="mono-t">{v}</text>}
          </g>
        );
      }))}
      {path2 && path2.length > 1 && <polyline points={pts(path2, 5)} fill="none" stroke="var(--warn)" strokeWidth="3" strokeDasharray="5 4" strokeLinejoin="round" />}
      {path && path.length > 1 && <polyline points={pts(path, 0)} fill="none" stroke="var(--primary)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />}
      {path && path.map((s, i) => <circle key={i} cx={cx(s)} cy={cy(s)} r={i === path.length - 1 ? 6 : 3.5} fill="var(--primary)" stroke="var(--surface-strong)" strokeWidth="1.5" />)}
    </svg>
  );
}

const statesOf = (sp, actions) => { let s = sp.start; const out = [s]; for (const a of actions) { [s] = rl.gridStep(sp, s, a); out.push(s); } return out; };

function ActionStrip({ task, actions }) {
  const names = task === 'bandit-3arm-deterministic' ? actions.map((a) => `arm ${a}`) : task === 'sequence-memory-4' ? actions.map(String) : actions.map((a) => rl.ARROWS[a]);
  return <div className="strip">{names.map((n, i) => <span key={i} className="chip">{n}</span>)}</div>;
}

// ------------------------------------------------------------ sections
export default function App() {
  useReveal();
  return (
    <div className="wrap">
      <MenuBar />
      <div className="glow" aria-hidden="true" />
      <Hero />
      <Environments />
      <Playground />
      <PostMortems />
      <Planning />
      <Trainer />
      <Results />
      <Ablations />
      <Seeds />
      <Baselines />
      <Limits />
      <Reproduce />
      <Dock />
      <footer>
        Code: Apache-2.0. Every number on this page is imported at build time from the level results files in the repo, or computed live in your browser by a JavaScript port of the repo's Python that the build checks against those files.
      </footer>
    </div>
  );
}

function Hero() {
  const gw = deepOf('gridworld-4x4');
  const b = gw.before.aggregate.success_rate, a = gw.after.aggregate.success_rate;
  return (
    <header className="card hero window" id="top" data-title="rl-environments-and-verifiers - README">
      <div className="head">
        <p className="eyebrow">Stdlib Python · replay verifiers · GRPO-style trainer</p>
        <span className="pill good">● {build.grader_passed_total} of {build.grader_total} grader scenarios as expected</span>
      </div>
      <h1>Rewards that can't be <em>faked</em>: a policy trained only on verified rewards goes from {b} to {a} success on GridWorld.</h1>
      <p className="sub">
        Four small deterministic environments, a replay verifier for each that recomputes every step instead of trusting the log, and a GRPO-style
        trainer whose only reward signal is that verifier. Plain scope, stated first: this is a teaching analogue, a tabular softmax policy, with no language model,
        no KL penalty, no clipping and no reference policy. The verifier and the trainer below run live in your browser, and the build fails if they drift from the recorded Python results.
      </p>
      <div className="actions">
        <a className="btn primary" href="#verifier">Try to fool the verifier</a>
        <a className="btn ghost" href="#trainer">Train a policy live</a>
        <span className="hint">Reproduce with <code>python3 level-3-deep/run_deep.py</code></span>
      </div>
      <div className="tiles">
        <div className="tile"><div className="num">{build.environment_count}</div><div className="cap">Environments, each with its own replay verifier</div></div>
        <div className="tile"><div className="num">{build.grader_passed_total}/{build.grader_total}</div><div className="cap">Build grader scenarios graded as expected</div></div>
        <div className="tile"><div className="num">{learn.grader_passed}/{learn.grader_total}</div><div className="cap">Learn grader scenarios graded as expected</div></div>
        <div className="tile"><div className="num">{deep.tasks.filter((t) => t.after.aggregate.success_rate > t.before.aggregate.success_rate).length}/{deep.tasks.length}</div><div className="cap">Tasks where trained success beats the untrained policy</div></div>
      </div>
      <div className="deltas" role="list" aria-label="Success rate before and after training">
        {deep.tasks.map((t) => {
          const s0 = t.before.aggregate.success_rate, s1 = t.after.aggregate.success_rate;
          return (
            <div className="delta" role="listitem" key={t.task}>
              <div className="lab"><span>{L[t.task]}</span><b>{s0} → {s1}</b></div>
              <div className="track"><div className="fill" style={{ width: `${s0 * 100}%`, background: 'var(--muted)', position: 'absolute', opacity: 0.5 }} /><div className="fill" style={{ width: `${s1 * 100}%`, background: 'var(--primary)' }} /></div>
            </div>
          );
        })}
        <p className="hint" style={{ margin: 0 }}>Sampled success over {EVAL_N} evaluation episodes (seeds {deep.evaluation.seeds[0]} to {deep.evaluation.seeds.at(-1)}), one training seed each. The seed sweep below retrains each task over {seeds.n_training_seeds} seeds.</p>
      </div>
    </header>
  );
}

function Environments() {
  const gw = envOf('gridworld-4x4'), cl = envOf('cliffgrid-3x5'), bd = envOf('bandit-3arm-deterministic'), sq = envOf('sequence-memory-4');
  const gwPath = statesOf(rl.GW, gw.greedy_policy.actions), clPath = statesOf(rl.CLIFF, cl.greedy_policy.actions);
  const stepR = rl.gridStep(rl.GW, rl.GW.start, 0)[1]; // bump into the top edge: the plain step cost
  const goalNet = rl.gridStep(rl.GW, [rl.GW.goal[0] - 1, rl.GW.goal[1]], 2)[1];
  const cell = (s) => `(${s[0]},${s[1]})`;
  return (
    <section id="envs" className="card window reveal" data-title="envs/ - 4 tasks">
      <p className="eyebrow">The environments</p>
      <h2>Four tiny tasks with <em>no randomness</em> in the rules, so every log can be replayed exactly.</h2>
      <p className="sub">Randomness lives only in the seeded policies. Rules are drawn from the code (ported to <span className="mono">rl.js</span>); the blue line is the value-iteration optimal path from <span className="mono">results_build.json</span>.</p>
      <div className="grid2 envs" style={{ marginTop: 16 }}>
        <div className="tile">
          <div className="head" style={{ marginBottom: 8 }}><h3>GridWorld 4x4</h3><span className="pill info">optimal return {gw.greedy_policy.return}</span></div>
          <GridSVG sp={rl.GW} path={gwPath} label="GridWorld 4 by 4 with walls, a pit and the optimal path" />
          <p className="hint">Start {cell(rl.GW.start)}, goal {cell(rl.GW.goal)}, pit {cell(rl.GW.bad[0])}, walls {rl.GW.walls.map(cell).join(' and ')}. Every step pays {stepR}, the goal adds {goalNet - stepR} (net {goalNet}), the pit adds {rl.GW.badBonus}. Bumping a wall or edge stays put. Max {rl.GW.maxSteps} steps.</p>
        </div>
        <div className="tile">
          <div className="head" style={{ marginBottom: 8 }}><h3>CliffGrid 3x5</h3><span className="pill info">optimal return {cl.greedy_policy.return}</span></div>
          <GridSVG sp={rl.CLIFF} path={clPath} label="CliffGrid 3 by 5 with a cliff along the bottom row and the optimal path" />
          <p className="hint">Start {cell(rl.CLIFF.start)}, goal {cell(rl.CLIFF.goal)}, cliff cells {cell(rl.CLIFF.bad[0])} to {cell(rl.CLIFF.bad.at(-1))} end the episode with {stepR + rl.CLIFF.badBonus}. The optimal path goes up and along the row beside the cliff.</p>
        </div>
        <div className="tile">
          <div className="head" style={{ marginBottom: 8 }}><h3>3-arm deterministic bandit</h3><span className="pill info">optimal return {bd.optimal_policy.return}</span></div>
          <div className="arms">{bd.payoffs.map((p, i) => <div key={i} className={`arm ${i === bd.optimal_policy.actions[0] ? 'best' : ''}`}><b>{p}</b><small>arm {i}</small></div>)}</div>
          <p className="hint">{bd.horizon} pulls, each arm always pays the same amount. Always pulling arm {bd.optimal_policy.actions[0]} returns {bd.optimal_policy.return}. Explore-then-exploit ({bd.explore_then_exploit.explore_per_arm} pulls per arm) picks arm {bd.explore_then_exploit.chosen_arm}.</p>
        </div>
        <div className="tile">
          <div className="head" style={{ marginBottom: 8 }}><h3>Sequence memory 4</h3><span className="pill info">optimal return {sq.optimal_policy.return}</span></div>
          <div className="arms">{sq.target.map((s, i) => <div key={i} className="arm best"><b>{s}</b><small>position {i}</small></div>)}</div>
          <p className="hint">Emit the public target one symbol at a time from {'{'}{rl.SEQ_SYMBOLS.join(', ')}{'}'}: +{rl.SEQ_CORRECT} when right, {rl.SEQ_WRONG} when wrong. An always-zero policy returns {sq.always_zero.return} with accuracy {sq.always_zero.accuracy}.</p>
        </div>
      </div>
    </section>
  );
}

const REASONS = {
  bad_start: 'the log does not begin at the start state',
  length_mismatch: 'states, actions and rewards do not line up',
  too_many_steps: 'more steps than the episode limit',
  illegal_transition: 'replaying the logged action lands somewhere else',
  reward_mismatch: 'a logged reward differs from what the environment pays',
  steps_after_terminal: 'the log keeps going after the episode ended',
  goal_claim_false: 'the log claims the goal but does not end there',
  terminal_mismatch: 'the terminal flag disagrees with the final state',
  return_mismatch: 'the claimed return is not the sum the replay computes',
  illegal_action: 'an arm outside 0, 1, 2 was logged',
};

function Playground() {
  const [task, setTask] = useState('gridworld-4x4');
  const scenarios = useMemo(() => rl.graderScenarios(task, task === 'gridworld-4x4' ? 'learn' : 'build'), [task]);
  const [scenario, setScenario] = useState('teleport');
  const [traj, setTraj] = useState(() => structuredClone(rl.graderScenarios('gridworld-4x4', 'learn').find((s) => s.name === 'teleport').traj));
  const sp = rl.GRID_SPECS[task];
  const load = (name, list = scenarios) => { setScenario(name); setTraj(structuredClone(list.find((s) => s.name === name).traj)); };
  const changeTask = (t) => { setTask(t); const list = rl.graderScenarios(t, t === 'gridworld-4x4' ? 'learn' : 'build'); load(list[0].name, list); };
  const [ok, reasons] = rl.verify(task, traj);
  const edit = (fn) => { setScenario('edited'); setTraj((t) => { const n = structuredClone(t); fn(n); return n; }); };
  const honestClaims = (n) => {
    n.return = n.rewards.reduce((a, b) => a + b, 0);
    const last = n.states.at(-1);
    n.terminal = rl.gridIsTerminal(sp, last);
    n.reached_goal = last[0] === sp.goal[0] && last[1] === sp.goal[1];
  };
  const stepAction = (a) => edit((n) => { const [s, r] = rl.gridStep(sp, n.states.at(-1), a); n.actions.push(a); n.rewards.push(r); n.states.push(s); honestClaims(n); });
  const undo = () => edit((n) => { if (n.actions.length) { n.actions.pop(); n.rewards.pop(); n.states.pop(); honestClaims(n); } });
  const clear = () => edit((n) => { n.actions = []; n.rewards = []; n.states = [sp.start]; honestClaims(n); });
  const teleport = (cell) => edit((n) => { if (n.states.length > 1) n.states[n.states.length - 1] = cell; });
  // replay: what the environment says each step should have been
  const replay = traj.actions.map((a, i) => {
    if (sp) { const prev = traj.states[i]; if (!prev) return null; const [s, r] = rl.gridStep(sp, prev, a); return { s: `${s[0]},${s[1]}`, r }; }
    if (task === 'bandit-3arm-deterministic') return { s: String(i + 1), r: rl.PAYOFFS[a] };
    return { s: String(i + 1), r: a === rl.TARGET[i] ? rl.SEQ_CORRECT : rl.SEQ_WRONG };
  });
  const cells = sp ? rl.gridCells(sp) : [];
  const nAct = rl.N_ACTIONS[task];
  return (
    <section id="verifier" className="card window reveal" data-title="grid_verify.py - live">
      <div className="head">
        <div>
          <p className="eyebrow">Verifier playground · computed live</p>
          <h2>Tamper with a log and watch the <em>replay</em> catch it.</h2>
          <p className="sub">The verifier never trusts a claim: it replays every logged action from the start and recomputes each state, reward, the return and the goal and terminal flags.
            Load one of the recorded grader logs, or build your own with the arrow buttons, then edit any field. The JavaScript port is checked at build time to grade all {build.grader_total + learn.grader_total} recorded scenarios exactly as the Python did.</p>
        </div>
        <span className={`pill ${ok ? 'good' : 'bad'}`} aria-live="polite">● {ok ? 'ACCEPTED' : 'REJECTED'}</span>
      </div>
      <div className="controls">
        <Select label="Environment" value={task} onChange={changeTask} options={rl.TASKS.map((t) => [t, L[t]])} />
        <Select label="Load a recorded log" value={scenario} onChange={(v) => v !== 'edited' && load(v)} options={[...scenarios.map((s) => [s.name, `${s.name}${s.expect ? ` (expect ${s.expect})` : ' (valid)'}`]), ...(scenario === 'edited' ? [['edited', 'your edited log']] : [])]} />
      </div>
      <div className="grid2">
        <div>
          {sp ? (
            <>
              <GridSVG sp={sp} path={traj.states} label={`Logged path on ${L[task]}; click a cell to move the last logged state there`} onCell={teleport} mark={traj.states.at(-1)} />
              <div className="actions" style={{ marginTop: 10 }}>
                {rl.ARROWS.map((ar, a) => <button key={a} type="button" className="btn ghost sq" aria-label={`Take an honest step ${rl.ACTION_NAMES[a]}`} onClick={() => stepAction(a)} disabled={traj.actions.length >= 24}>{ar}</button>)}
                <button type="button" className="btn ghost" onClick={undo}>Undo</button>
                <button type="button" className="btn ghost" onClick={clear}>Clear</button>
              </div>
              <p className="hint">Arrow buttons append an honest step and recompute the claims. Clicking a cell rewrites the last logged state (a teleport). Everything else is editable in the log.</p>
            </>
          ) : (
            <div className="verdict-box">
              <h3>Replayed from the rules</h3>
              <ActionStrip task={task} actions={traj.actions} />
              <p className="hint">Replay return: <b>{replay.reduce((acc, r) => acc + r.r, 0)}</b>, claimed: <b>{traj.return}</b>.</p>
            </div>
          )}
          <div className="verdict-box" style={{ marginTop: 12 }}>
            <h3>{ok ? 'Verifier accepts this log' : `Verifier rejects this log: ${new Set(reasons).size} named reason${new Set(reasons).size > 1 ? 's' : ''}`}</h3>
            {ok ? <p className="hint">Every logged field matches the replay. Note the verifier checks consistency with the rules, not whether the task itself is the right task.</p> : (
              <ul className="reasons">{[...new Set(reasons)].map((r) => <li key={r}><code>{r}</code> × {reasons.filter((x) => x === r).length}<span className="hint"> {REASONS[r]}</span></li>)}</ul>
            )}
          </div>
        </div>
        <div>
          <div style={{ overflowX: 'auto' }}>
            <table className="log">
              <thead><tr><th>#</th><th>Action</th><th>State after</th><th>Reward</th><th>Replay says</th></tr></thead>
              <tbody>
                {traj.actions.map((a, i) => {
                  const rp = replay[i];
                  const st = traj.states[i + 1];
                  const stKey = sp ? (Array.isArray(st) ? `${st[0]},${st[1]}` : '') : String(st);
                  const badS = rp && rp.s !== stKey, badR = rp && rp.r !== traj.rewards[i];
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td><select aria-label={`Step ${i + 1} action`} value={a} onChange={(e) => edit((n) => { n.actions[i] = +e.target.value; })}>
                        {Array.from({ length: task === 'bandit-3arm-deterministic' ? 4 : nAct }, (_, k) => <option key={k} value={k}>{sp ? `${rl.ARROWS[k]} ${rl.ACTION_NAMES[k]}` : task === 'bandit-3arm-deterministic' ? `arm ${k}` : `symbol ${k}`}</option>)}
                      </select></td>
                      <td className={badS ? 'no' : ''}>{sp ? (
                        <select aria-label={`Step ${i + 1} logged state`} value={stKey} onChange={(e) => edit((n) => { n.states[i + 1] = e.target.value.split(',').map(Number); })}>
                          {cells.map((c) => <option key={`${c}`} value={`${c[0]},${c[1]}`}>({c[0]},{c[1]})</option>)}
                        </select>
                      ) : <input aria-label={`Step ${i + 1} logged state`} type="number" className="num-in" value={st} onChange={(e) => edit((n) => { n.states[i + 1] = +e.target.value; })} />}</td>
                      <td className={badR ? 'no' : ''}><input aria-label={`Step ${i + 1} logged reward`} type="number" className="num-in" value={traj.rewards[i]} onChange={(e) => edit((n) => { n.rewards[i] = +e.target.value; })} /></td>
                      <td className="mono">{rp ? `${sp ? `(${rp.s})` : rp.s}, ${rp.r}` : 'n/a'}</td>
                    </tr>
                  );
                })}
                {!traj.actions.length && <tr><td colSpan={5} className="hint">Empty log. Use the arrow buttons to take steps.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="claims">
            <div className="field"><label htmlFor="claim-ret">Claimed return</label><input id="claim-ret" type="number" value={traj.return} onChange={(e) => edit((n) => { n.return = +e.target.value; })} /></div>
            <label className="check"><input type="checkbox" checked={!!traj.reached_goal} onChange={(e) => edit((n) => { n.reached_goal = e.target.checked; })} /> Claims goal reached</label>
            {sp && <label className="check"><input type="checkbox" checked={!!traj.terminal} onChange={(e) => edit((n) => { n.terminal = e.target.checked; })} /> Claims terminal</label>}
          </div>
        </div>
      </div>
    </section>
  );
}

function PostMortems() {
  const rows = build.environments.map((e) => ({ task: e.task, ...e.hack_attempt, live: (() => {
    const s = rl.graderScenarios(e.task).find((x) => e.hack_attempt.name.includes(x.name));
    return rl.verify(e.task, s.traj)[1];
  })() }));
  return (
    <section id="hacks" className="card window reveal" data-title="post_mortems.md - recorded">
      <p className="eyebrow">Reward-hacking post-mortems · recorded</p>
      <h2>Four attempts to get paid without doing the task, and the check that caught each.</h2>
      <p className="sub">Each card is the <span className="mono">hack_attempt</span> entry in <a href={blob('level-2-build/results_build.json')}>results_build.json</a>. The reason codes are re-derived live by the in-page verifier from the same forged log. Two cards name a limit replay cannot see.</p>
      <div className="grid2" style={{ marginTop: 16 }}>
        {rows.map((r) => (
          <div className="tile" key={r.task}>
            <div className="head" style={{ marginBottom: 6 }}><h3>{L[r.task]}: <span className="mono">{r.name}</span></h3><span className={`pill ${r.verifier_caught ? 'good' : 'bad'}`}>{r.verifier_caught ? 'Caught' : 'Missed'}</span></div>
            <p className="hint" style={{ margin: '0 0 8px', fontSize: 13 }}>{r.detail}.</p>
            <div className="strip">{[...new Set(r.live)].map((x) => <code key={x}>{x}</code>)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Planning() {
  const [which, setWhich] = useState('gridworld-4x4');
  const sp = rl.GRID_SPECS[which];
  const env = envOf(which);
  const recordedValues = which === 'gridworld-4x4' ? learn.optimal_values : env.optimal_values;
  const live = useMemo(() => rl.gridValueIteration(sp), [sp]);
  const match = same(Object.keys(live.V).sort().map((k) => [k, live.V[k]]), Object.keys(recordedValues).sort().map((k) => [k, recordedValues[k]]));
  const rec = which === 'gridworld-4x4' ? learn.q_learning : env.q_learning;
  const [qs, setQs] = useState({ seed: rec.seed, alpha: rec.alpha, epsilon: rec.epsilon, episodes: rec.training_episodes });
  const [qres, setQres] = useState(null);
  useEffect(() => { setQs({ seed: rec.seed, alpha: rec.alpha, epsilon: rec.epsilon, episodes: rec.training_episodes }); setQres(null); }, [which]); // eslint-disable-line react-hooks/exhaustive-deps
  const runQ = () => { const t0 = performance.now(); const t = rl.gridQGreedy(sp, rl.gridTrainQ(sp, qs.seed, qs.episodes, qs.alpha, qs.epsilon)); setQres({ ...t, ms: performance.now() - t0, ...qs }); };
  const isRec = qres && qres.seed === rec.seed && qres.alpha === rec.alpha && qres.epsilon === rec.epsilon && qres.episodes === rec.training_episodes;
  const recPath = statesOf(sp, rec.greedy_after_training.actions);
  return (
    <section id="planning" className="card window reveal" data-title="value_iteration.svg - recorded and live">
      <div className="head">
        <div>
          <p className="eyebrow">Planning baselines</p>
          <h2>The optimal values, recomputed in your browser, <em>match</em> the recorded table.</h2>
          <p className="sub">Value iteration (gamma 1, episodic) over every cell. The heat map is the live result; the badge compares it cell by cell with <span className="mono">optimal_values</span> in the results file. Blue: greedy path on those values. Dashed amber: the Q-learning greedy path, recorded or retrained live.</p>
        </div>
        <Seg label="Grid" value={which} onChange={setWhich} options={[['gridworld-4x4', 'GridWorld'], ['cliffgrid-3x5', 'CliffGrid']]} />
      </div>
      <div className="grid2">
        <div>
          <GridSVG sp={sp} values={live.V} path={rl.gridRunEpisode(sp, rl.gridGreedyPolicy(sp, live.V)).states} path2={qres ? qres.states : recPath} label={`Optimal value heat map for ${L[which]} with greedy and Q-learning paths`} cell={62} />
          <div className="legend"><span><i style={{ background: 'var(--primary)' }} />value-iteration greedy</span><span><i style={{ background: 'var(--warn)' }} />Q-learning greedy ({qres ? 'live' : 'recorded'})</span></div>
        </div>
        <div>
          <div className="strip" style={{ marginBottom: 12 }}>
            <span className={`pill ${match ? 'good' : 'bad'}`}>{match ? '✓ live values match the recorded table' : 'live values differ from the record'}</span>
            <span className="pill info">converged in {live.sweeps} sweeps</span>
          </div>
          <p className="hint">Optimal value at the start: <b>{live.V[`${sp.start[0]},${sp.start[1]}`]}</b> (recorded {which === 'gridworld-4x4' ? learn.optimal_value_start : env.optimal_value_start}).
            Recorded Q-learning: seed {rec.seed}, {rec.training_episodes.toLocaleString()} episodes, alpha {rec.alpha}, epsilon {rec.epsilon}; greedy return {rec.greedy_after_training.return} in {rec.greedy_after_training.steps} steps.</p>
          <h3 style={{ marginTop: 14 }}>Retrain Q-learning live</h3>
          <div className="controls" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="field"><label htmlFor="q-seed">Seed</label><input id="q-seed" type="number" value={qs.seed} onChange={(e) => setQs({ ...qs, seed: +e.target.value || 0 })} /></div>
            <Range label="Episodes" value={qs.episodes} min={100} max={6000} step={100} onChange={(v) => setQs({ ...qs, episodes: v })} show={qs.episodes.toLocaleString()} />
            <Range label="Alpha" value={qs.alpha} min={0.01} max={1} step={0.01} onChange={(v) => setQs({ ...qs, alpha: v })} show={qs.alpha} />
            <Range label="Epsilon" value={qs.epsilon} min={0} max={1} step={0.01} onChange={(v) => setQs({ ...qs, epsilon: v })} show={qs.epsilon} />
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <button type="button" className="btn primary" onClick={runQ}>Train Q-learning</button>
            {qres && <span className={`pill ${isRec ? (same(qres.actions, rec.greedy_after_training.actions) ? 'good' : 'bad') : 'info'}`}>{isRec ? (same(qres.actions, rec.greedy_after_training.actions) ? 'reproduces the recorded run' : 'differs from record') : 'fresh run, Python RNG port'}</span>}
          </div>
          {qres && <p className="hint" aria-live="polite">Greedy policy: {qres.reached_goal ? 'reaches the goal' : 'does not reach the goal'} in {qres.steps} steps, return {qres.return}. Trained in {qres.ms.toFixed(0)} ms.</p>}
        </div>
      </div>
    </section>
  );
}

const configOf = (task) => { const t = deepOf(task); return { mode: t.reward_mode, lr: t.train.lr, group: t.train.group_size, iterations: t.train.iterations, seed: t.train.seed, advantage: 'group' }; };

function CurveSVG({ curve, label, height = 200 }) {
  const W = 560, H = height, pad = { l: 40, r: 8, t: 10, b: 24 };
  const ys = curve.map((c) => c[0]);
  const lo = Math.min(0, ...ys), hi = Math.max(1, ...ys);
  const x = (i) => pad.l + (i / Math.max(1, curve.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (H - pad.t - pad.b);
  const ticks = [lo, (lo + hi) / 2, hi];
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks.map((t) => <g key={t}><line className="axis" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} /><text x={pad.l - 6} y={y(t) + 4} textAnchor="end">{f3(t)}</text></g>)}
      {curve.map((c, i) => c[1] ? null : <rect key={i} x={x(i) - 0.5} y={pad.t} width={Math.max(1, (W - pad.l - pad.r) / curve.length)} height={H - pad.t - pad.b} fill="var(--muted)" opacity="0.08" />)}
      <polyline fill="none" stroke="var(--primary)" strokeWidth="1.8" points={curve.map((c, i) => `${x(i)},${y(c[0])}`).join(' ')} />
      <text x={pad.l} y={H - 4}>iteration 1</text><text x={W - pad.r} y={H - 4} textAnchor="end">iteration {curve.length}</text>
    </svg>
  );
}

function Trainer() {
  const [task, setTask] = useState('gridworld-4x4');
  const [cfg, setCfg] = useState(() => configOf('gridworld-4x4'));
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const rec = deepOf(task);
  const run = useCallback((t = task, c = cfg) => {
    setBusy(true);
    requestAnimationFrame(() => setTimeout(() => {
      const t0 = performance.now();
      const curve = [];
      const [theta, info] = rl.train(t, c.mode, c.iterations, c.lr, c.seed, { group: c.group, advantage: c.advantage, curve });
      const after = rl.evaluate(t, theta);
      const before = rl.evaluate(t, rl.initialTheta(t));
      setRes({ task: t, cfg: c, curve, info, after, before, greedy: rl.greedyEpisode(t, theta), ms: performance.now() - t0 });
      setBusy(false);
    }, 0));
  }, [task, cfg]);
  useEffect(() => { run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const changeTask = (t) => { setTask(t); const c = configOf(t); setCfg(c); run(t, c); };
  const set = (k) => (v) => setCfg({ ...cfg, [k]: v });
  // provenance badge: does this live run equal a recorded run?
  let badge = null;
  if (res) {
    const rc = configOf(res.task);
    const base = res.cfg.mode === rc.mode && res.cfg.lr === rc.lr && res.cfg.group === rc.group && res.cfg.iterations === rc.iterations;
    const sweep = seeds.tasks[res.task];
    if (base && res.cfg.seed === rc.seed && res.cfg.advantage === 'group') {
      const okRun = same(res.after, deepOf(res.task).after) && same(res.curve, curves.tasks[res.task]);
      badge = okRun ? ['good', `✓ reproduces the recorded run in results_deep.json (seed ${rc.seed})`] : ['bad', 'differs from the recorded run'];
    } else if (base) {
      const arm = res.cfg.advantage === 'group' ? sweep.grpo : sweep.reinforce_mean_baseline;
      const r = arm.runs.find((x) => x.seed === res.cfg.seed);
      if (r) badge = r.success_rate === res.after.aggregate.success_rate ? ['good', `✓ matches results_seeds.json, seed ${r.seed}`] : ['bad', 'differs from results_seeds.json'];
    }
    if (!badge) badge = ['info', 'fresh run with the Python RNG port, not a recorded result'];
  }
  const a = res?.after.aggregate, b = res?.before.aggregate;
  const sp = res && rl.GRID_SPECS[res.task];
  return (
    <section id="trainer" className="card window reveal" data-title="rlvr_trainer - live">
      <div className="head">
        <div>
          <p className="eyebrow">GRPO-style trainer · computed live</p>
          <h2>Train the policy in your browser on <em>verifier-only</em> reward.</h2>
          <p className="sub">Each iteration samples a group of episodes, replay-verifies every one, reads the reward from the verified log (success bit or return), and nudges a tabular softmax policy toward the episodes that beat the group mean, divided by the group standard deviation.
            A group where every episode scored the same is uninformative and makes no update (grey bands on the curve). The defaults are the recorded settings, and the port reproduces those runs bit for bit, including Python's Mersenne Twister.</p>
        </div>
        {res && <span className="pill info">{res.info.episodes_sampled.toLocaleString()} training + {2 * EVAL_N} eval episodes in {res.ms.toFixed(0)} ms</span>}
      </div>
      <div className="controls">
        <Select label="Task" value={task} onChange={changeTask} options={rl.TASKS.map((t) => [t, L[t]])} />
        <Select label="Reward mode" value={cfg.mode} onChange={set('mode')} options={[['success', 'success bit (1 if goal)'], ['return', 'verified episode return']]} />
        <Select label="Advantage" value={cfg.advantage} onChange={set('advantage')} options={[['group', 'GRPO-style (÷ std)'], ['mean', 'REINFORCE (mean)']]} />
        <Range label="Learning rate" value={cfg.lr} min={0.05} max={2} step={0.05} onChange={set('lr')} show={cfg.lr} />
        <Select label="Group size" value={String(cfg.group)} onChange={(v) => set('group')(+v)} options={[4, 8, 16, 32, 64].map((g) => [String(g), String(g)])} />
        <Range label="Iterations" value={cfg.iterations} min={10} max={600} step={10} onChange={set('iterations')} show={cfg.iterations} />
        <div className="field"><label htmlFor="tr-seed">Training seed</label><input id="tr-seed" type="number" value={cfg.seed} onChange={(e) => set('seed')(+e.target.value || 0)} /></div>
      </div>
      <div className="actions" style={{ marginTop: 0, marginBottom: 16 }}>
        <button type="button" className="btn primary" onClick={() => run()} disabled={busy}>{busy ? 'Training…' : 'Train and evaluate'}</button>
        <button type="button" className="btn ghost" onClick={() => { const c = configOf(task); setCfg(c); run(task, c); }}>Reset to recorded settings</button>
        {badge && <span className={`pill ${badge[0]}`}>{badge[1]}</span>}
      </div>
      <p className="hint" style={{ marginTop: -6 }}>Recorded settings for {L[task]}: {rec.reward_mode} reward, lr {rec.train.lr}, group {rec.train.group_size}, {rec.train.iterations} iterations, seed {rec.train.seed}. Seeds {seeds.tasks[task].seeds[1]}, {seeds.tasks[task].seeds[2]} … {seeds.tasks[task].seeds.at(-1)} match the seed sweep.</p>
      {res && (
        <div className="grid2" style={{ marginTop: 12 }}>
          <div>
            <h3>Group mean reward per iteration</h3>
            <CurveSVG curve={res.curve} label={`Learning curve: group mean reward per iteration for ${L[res.task]}`} />
            <div className="strip">
              <span className="pill good">{res.info.informative_groups} informative groups</span>
              <span className="pill warn">{res.info.uninformative_groups} uninformative (no update)</span>
            </div>
            <h3 style={{ marginTop: 14 }}>Greedy rollout of the trained policy</h3>
            {sp ? <GridSVG sp={sp} path={res.greedy.states} label={`Greedy rollout on ${L[res.task]}`} cell={44} /> : <ActionStrip task={res.task} actions={res.greedy.actions} />}
            <p className="hint">{res.greedy.reached_goal ? 'Reaches the goal' : 'Does not reach the goal'}, return {res.greedy.return}, {res.greedy.steps} steps, verified: {String(res.greedy.verified)}.</p>
          </div>
          <div>
            <h3>Before and after, {EVAL_N} sampled evaluation episodes</h3>
            <table style={{ marginTop: 8 }}>
              <thead><tr><th>Metric</th><th>Untrained</th><th>Trained</th></tr></thead>
              <tbody>
                {[['Success rate', 'success_rate'], ['Mean return', 'mean_return'], ['Return variance', 'return_variance'], ['pass@1', 'pass_at_1'], ['pass@3', 'pass_at_3'], ['pass@5', 'pass_at_5']].map(([lab, k]) => (
                  <tr key={k}><td>{lab}</td><td>{b[k]}</td><td><b>{a[k]}</b></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function Results() {
  const [task, setTask] = useState('gridworld-4x4');
  const t = deepOf(task);
  const W = 560, H = 220, pad = { l: 36, r: 8, t: 12, b: 26 };
  const metrics = [['success_rate', 'success'], ['pass_at_1', 'pass@1'], ['pass_at_3', 'pass@3'], ['pass_at_5', 'pass@5']];
  const gw = (W - pad.l - pad.r) / metrics.length;
  const y = (v) => pad.t + (1 - v) * (H - pad.t - pad.b);
  const ub = (agg, k) => rl.passAtKUnbiased(agg.episodes, Math.round(agg.success_rate * agg.episodes), k);
  return (
    <section id="results" className="card window reveal" data-title={`results_deep.json - ${EVAL_N} eval episodes`}>
      <div className="head">
        <div>
          <p className="eyebrow">Before and after · recorded, results_deep.json</p>
          <h2>All four tasks move from near zero to near perfect success.</h2>
          <p className="sub">The recorded GRPO-style runs, scored on {EVAL_N} sampled episodes (seeds {deep.evaluation.seeds.join(', ')}, {deep.evaluation.episodes_per_seed} each). Recorded pass@k uses disjoint in-order blocks of k episodes. The unbiased estimator 1 − C(n−c,k)/C(n,k) (Chen et al. 2021) is computed live beside it; on these runs the two agree to three decimals or better, because success is either very rare or nearly certain.</p>
        </div>
        <Seg label="Task" value={task} onChange={setTask} options={rl.TASKS.map((k) => [k, L[k].split(' ')[0]])} />
      </div>
      <div className="grid2">
        <div>
          <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Success and pass at k before and after training for ${L[task]}`}>
            {[0, 0.5, 1].map((v) => <g key={v}><line className="axis" x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} /><text x={pad.l - 6} y={y(v) + 4} textAnchor="end">{v}</text></g>)}
            {metrics.map(([k, lab], i) => {
              const v0 = t.before.aggregate[k], v1 = t.after.aggregate[k], x0 = pad.l + i * gw + gw * 0.18, bw = gw * 0.3;
              return (
                <g key={k}>
                  <rect x={x0} y={y(v0)} width={bw} height={Math.max(1, y(0) - y(v0))} fill="var(--muted)" opacity="0.45" rx="3" />
                  <rect x={x0 + bw + 4} y={y(v1)} width={bw} height={Math.max(1, y(0) - y(v1))} fill="var(--primary)" rx="3" />
                  <text x={x0 + bw} y={H - 8} textAnchor="middle">{lab}</text>
                  <text x={x0 + bw / 2} y={y(v0) - 4} textAnchor="middle">{v0}</text>
                  <text x={x0 + bw * 1.5 + 4} y={y(v1) - 4} textAnchor="middle">{v1}</text>
                </g>
              );
            })}
          </svg>
          <div className="legend"><span><i style={{ background: 'var(--muted)' }} />untrained (uniform)</span><span><i style={{ background: 'var(--primary)' }} />trained</span></div>
        </div>
        <div>
          <h3>Per evaluation seed, trained policy</h3>
          <table style={{ marginTop: 8 }}>
            <thead><tr><th>Seed</th><th>Success</th><th>Mean return</th><th>Variance</th></tr></thead>
            <tbody>{t.after.per_seed.map((s, i) => <tr key={i}><td>{deep.evaluation.seeds[i]}</td><td>{s.success_rate}</td><td>{s.mean_return}</td><td>{s.return_variance}</td></tr>)}</tbody>
          </table>
          <p className="hint">Greedy action sequence after training: </p>
          <ActionStrip task={task} actions={t.greedy_after.actions} />
        </div>
      </div>
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table>
          <thead><tr><th>Task</th><th>Reward</th><th>Success</th><th>Mean return</th><th>Return variance</th><th>pass@3 block / unbiased</th><th>pass@5 block / unbiased</th><th>Informative groups</th></tr></thead>
          <tbody>
            {deep.tasks.map((r) => {
              const A = r.after.aggregate, B = r.before.aggregate;
              return (
                <tr key={r.task}><td>{L[r.task]}</td><td>{r.reward_mode}</td><td>{B.success_rate} → <b>{A.success_rate}</b></td><td>{B.mean_return} → <b>{A.mean_return}</b></td><td>{B.return_variance} → {A.return_variance}</td>
                  <td>{A.pass_at_3} / {ub(A, 3)}</td><td>{A.pass_at_5} / {ub(A, 5)}</td><td>{r.train.informative_groups} of {r.train.iterations}</td></tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Ablations() {
  const [live, setLive] = useState({});
  const rerun = (ab) => {
    const [theta, info] = rl.train(ab.task, ab.reward_mode, ab.train.iterations, ab.train.lr, ab.train.seed);
    const after = rl.evaluate(ab.task, theta);
    setLive((l) => ({ ...l, [ab.name]: { ok: same(after, ab.after) && info.informative_groups === ab.train.informative_groups, s: after.aggregate.success_rate } }));
  };
  const text = {
    'cliffgrid-return-mode': `Reward is the verified return instead of the success bit, at lr {lr}. Walking off the cliff at once costs less than wandering for ${rl.CLIFF.maxSteps} steps, so the policy learns to jump.`,
    'bandit-success-mode': `Reward is the success bit (every pull on the best arm) instead of the return. Random sampling almost never pulls the best arm ${rl.BANDIT_HORIZON} times in a row, so every group scores 0 and nothing updates.`,
  };
  return (
    <section id="ablations" className="card window reveal" data-title="ablations/ - recorded, re-runnable live">
      <p className="eyebrow">Ablations · recorded, re-runnable</p>
      <h2>Change only the reward rule and the same trainer <em>fails</em> in two different ways.</h2>
      <p className="sub">Both ablations are in <a href={blob('level-3-deep/results_deep.json')}>results_deep.json</a>. Press re-run to train the same configuration in your browser and compare with the record.</p>
      <div className="grid2" style={{ marginTop: 16 }}>
        {deep.ablations.map((ab) => {
          const A = ab.after.aggregate, sp = rl.GRID_SPECS[ab.task], l = live[ab.name];
          return (
            <div className="tile" key={ab.name}>
              <div className="head" style={{ marginBottom: 6 }}><h3 className="mono">{ab.name}</h3><span className="pill bad">success {A.success_rate}</span></div>
              <p className="hint" style={{ marginTop: 0 }}>{text[ab.name].replace('{lr}', ab.train.lr)}</p>
              {sp ? <GridSVG sp={sp} path={statesOf(sp, ab.greedy_after.actions)} label={`Greedy trajectory after the ${ab.name} ablation`} cell={44} /> : <ActionStrip task={ab.task} actions={ab.greedy_after.actions} />}
              <table style={{ marginTop: 8 }}><tbody>
                <tr><td>Mean return after</td><td><b>{A.mean_return}</b></td></tr>
                <tr><td>Informative groups</td><td>{ab.train.informative_groups} of {ab.train.iterations}</td></tr>
                <tr><td>Greedy episode</td><td>return {ab.greedy_after.return}, {ab.greedy_after.steps} step{ab.greedy_after.steps > 1 ? 's' : ''}</td></tr>
              </tbody></table>
              <div className="actions" style={{ marginTop: 10 }}>
                <button type="button" className="btn ghost" onClick={() => rerun(ab)}>Re-run live</button>
                {l && <span className={`pill ${l.ok ? 'good' : 'bad'}`}>{l.ok ? `✓ live run matches the record (success ${l.s})` : 'differs from the record'}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Seeds() {
  const [task, setTask] = useState('sequence-memory-4');
  const b = seeds.tasks[task];
  const W = 980, rowH = 46, H = 4 * rowH + 28, l = 150, r = 14;
  const x = (v) => l + v * (W - l - r);
  const sens = b.sensitivity;
  const LRS = [...new Set(sens.cells.map((c) => c.lr))], GROUPS = [...new Set(sens.cells.map((c) => c.group))];
  const det = seeds.tasks['cliffgrid-3x5'].detour, ho = seeds.tasks['sequence-memory-4'].heldout_targets;
  const hist = Object.entries(det.steps_histogram).map(([k, v]) => [+k, v]).sort((p, q) => p[0] - q[0]);
  const hmax = Math.max(...hist.map((h) => h[1]));
  return (
    <section id="seeds" className="card window reveal" data-title="run_seeds.py - 10 training seeds">
      <div className="head">
        <div>
          <p className="eyebrow">Seed sweep and baselines · recorded, results_seeds.json</p>
          <h2>Ten training seeds per task, and a baseline that tests the <em>group</em> normalisation.</h2>
          <p className="sub">Each dot is one full training run, scored on the same {EVAL_N} evaluation episodes. Blue: the GRPO-style update. Amber: REINFORCE with a mean baseline and no division by the group standard deviation, same seeds, same lr, same {GROUP_N}-episode groups and episode budget. Bars mark the mean and its 95% t-interval across seeds.</p>
        </div>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Success rate across ten training seeds per task, GRPO-style versus REINFORCE">
        {[0, 0.25, 0.5, 0.75, 1].map((v) => <g key={v}><line className="axis" x1={x(v)} x2={x(v)} y1={4} y2={H - 22} /><text x={x(v)} y={H - 6} textAnchor="middle">{v}</text></g>)}
        {rl.TASKS.map((t, i) => {
          const s = seeds.tasks[t];
          return (
            <g key={t} transform={`translate(0 ${i * rowH + 22})`}>
              <text x={0} y={4} style={{ fill: 'var(--text)', fontSize: 13 }}>{L[t]}</text>
              {[['grpo', 'var(--primary)', -7], ['reinforce_mean_baseline', 'var(--warn)', 7]].map(([arm, c, dy]) => (
                <g key={arm}>
                  <line x1={x(s[arm].success_rate.ci95[0])} x2={x(s[arm].success_rate.ci95[1])} y1={dy} y2={dy} stroke={c} strokeWidth="5" strokeLinecap="round" opacity="0.35" />
                  {s[arm].runs.map((run) => <circle key={run.seed} cx={x(run.success_rate)} cy={dy} r="4.2" fill={c} opacity="0.75" />)}
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table>
          <thead><tr><th>Task</th><th>GRPO-style success, mean ± sd (min to max)</th><th>REINFORCE mean baseline</th><th>Q-learning, same episodes</th></tr></thead>
          <tbody>
            {rl.TASKS.map((t) => {
              const s = seeds.tasks[t], g = s.grpo.success_rate, rf = s.reinforce_mean_baseline.success_rate;
              return (
                <tr key={t}><td>{L[t]}</td><td>{g.mean} ± {g.sd} ({g.min} to {g.max})</td><td>{rf.mean} ± {rf.sd} ({rf.min} to {rf.max})</td>
                  <td>{s.q_learning ? `greedy reaches goal in ${s.q_learning.greedy_goal_seeds} of ${s.q_learning.runs.length} seeds (${s.q_learning.episodes.toLocaleString()} episodes)` : 'not run: no tabular Q baseline in the repo for this task'}</td></tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">Read: the group-normalised update matters most where success is rare. On the sequence task the mean-baseline learner stays near {seeds.tasks['sequence-memory-4'].reinforce_mean_baseline.success_rate.mean} because a group with one success gives an advantage under 1, while dividing by the small group standard deviation scales the same signal up.</p>
      <div className="grid2" style={{ marginTop: 20 }}>
        <div>
          <div className="head" style={{ marginBottom: 8 }}>
            <h3>lr × group size, fixed budget of {sens.episode_budget.toLocaleString()} episodes</h3>
            <Seg label="Sensitivity task" value={task} onChange={setTask} options={rl.TASKS.map((k) => [k, L[k].split(' ')[0]])} />
          </div>
          <svg className="chart" viewBox="0 0 300 236" role="img" aria-label={`Mean success over ${sens.seeds.length} seeds for each learning rate and group size on ${L[task]}`} style={{ maxWidth: 360 }}>
            {seeds.tasks[task].sensitivity.cells.map((c) => {
              const i = LRS.indexOf(c.lr), j = GROUPS.indexOf(c.group);
              return (
                <g key={`${c.lr}-${c.group}`}>
                  <rect x={60 + j * 58} y={10 + i * 50} width={54} height={46} rx="6" fill="var(--primary)" fillOpacity={0.06 + 0.6 * c.mean_success_rate} stroke="var(--border)" />
                  <text x={60 + j * 58 + 27} y={10 + i * 50 + 27} textAnchor="middle" style={{ fill: 'var(--text)', fontWeight: 700 }}>{f3(c.mean_success_rate)}</text>
                </g>
              );
            })}
            {LRS.map((v, i) => <text key={v} x={52} y={10 + i * 50 + 27} textAnchor="end">lr {v}</text>)}
            {GROUPS.map((v, j) => <text key={v} x={60 + j * 58 + 27} y={226} textAnchor="middle">group {v}</text>)}
          </svg>
          <p className="hint">Mean success over seeds {sens.seeds.join(', ')}. Iterations are set to budget ÷ group, so every cell sees the same number of episodes.</p>
        </div>
        <div>
          <h3>Why the CliffGrid greedy path takes {det.greedy.steps} steps, not {det.optimal_steps}</h3>
          <svg className="chart" viewBox="0 0 300 150" role="img" aria-label="Episode lengths of successful CliffGrid evaluation episodes after training" style={{ maxWidth: 360, marginTop: 8 }}>
            {hist.map(([k, v], i) => {
              const bw = 280 / hist.length;
              return (
                <g key={k}>
                  <rect x={10 + i * bw} y={120 - (v / hmax) * 100} width={bw - 4} height={(v / hmax) * 100} rx="3" fill={k === det.optimal_steps ? 'var(--good)' : 'var(--primary)'} opacity="0.8" />
                  <text x={10 + i * bw + (bw - 4) / 2} y={136} textAnchor="middle">{k}</text>
                  <text x={10 + i * bw + (bw - 4) / 2} y={116 - (v / hmax) * 100} textAnchor="middle">{v}</text>
                </g>
              );
            })}
          </svg>
          <p className="hint">Steps taken by the {det.successes} successful evaluation episodes of the recorded CliffGrid policy. Only {pct(det.optimal_share)} take the {det.optimal_steps}-step optimum: the success-bit reward pays every successful path the same, so nothing pushes toward the shortest one.</p>
          <h3 style={{ marginTop: 14 }}>Sequence task: memorised, not recalled</h3>
          <p className="hint">The trained policy emits {ho.greedy_output.join(', ')} every time. Its expected success on the trained target is {ho.trained_target_expected_success}; averaged over the {ho.heldout_targets} other targets it is {ho.expected_success_mean} (best case {ho.expected_success_max}). A position-indexed table cannot generalise, and this measures it.</p>
        </div>
      </div>
    </section>
  );
}

function Baselines() {
  const rows = build.environments.map((e) => {
    const r = e.random_policy;
    const seed = { 'gridworld-4x4': 20261105, 'cliffgrid-3x5': 20261106, 'bandit-3arm-deterministic': 20261107, 'sequence-memory-4': 20261108 }[e.task];
    const live = rl.GRID_SPECS[e.task] ? rl.gridEvaluateRandom(rl.GRID_SPECS[e.task], seed, r.episodes) : e.task === 'bandit-3arm-deterministic' ? rl.banditEvaluateRandom(seed, r.episodes) : rl.seqEvaluateRandom(seed, r.episodes);
    const third = r.goal_rate !== undefined ? `goal ${r.goal_rate}, ${rl.GRID_SPECS[e.task].badName} ${r.bad_rate}` : r.mean_best_arm_rate !== undefined ? `best-arm rate ${r.mean_best_arm_rate}` : `accuracy ${r.mean_accuracy}`;
    return { task: e.task, r, seed, third, match: same(live, r) };
  });
  return (
    <section id="baselines" className="card window reveal" data-title="random_policy.json - recorded">
      <p className="eyebrow">Random-policy baselines · recorded, re-derived live</p>
      <h2>What a policy that picks uniformly at random scores.</h2>
      <p className="sub">From the <span className="mono">random_policy</span> blocks in <a href={blob('level-2-build/results_build.json')}>results_build.json</a>. Each row is recomputed when the page loads with the seeded Python RNG port, and the badge shows whether it matches.</p>
      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table>
          <thead><tr><th>Environment</th><th>Seed</th><th>Episodes</th><th>Mean return</th><th>Rates</th><th>Live check</th></tr></thead>
          <tbody>{rows.map((x) => <tr key={x.task}><td>{L[x.task]}</td><td>{x.seed}</td><td>{x.r.episodes}</td><td>{x.r.mean_return}</td><td>{x.third}</td><td><span className={`pill ${x.match ? 'good' : 'bad'}`}>{x.match ? 'matches' : 'differs'}</span></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

// ROADMAP.md shown as written, with internal project codes swapped for plain names.
const PLAIN = [[/the agent-evals harness \(P27\)/g, 'an external scoring harness'], [/P27 harness integration/g, 'External scoring harness integration'], [/the in-repo P06-pattern\s+scorer/g, 'the in-repo scorer'], [/\bLLM\b/g, 'language-model']];
const roadmap = roadmapMd.split('## v1.1 backlog')[1].split(/\n(?=\d+\. )/).map((s) => s.trim()).filter((s) => /^\d+\./.test(s))
  .map((s) => PLAIN.reduce((acc, [re, rep]) => acc.replace(re, rep), s.replace(/^\d+\.\s*/, '').replace(/\s+/g, ' ')));

function Limits() {
  const cl = deepOf('cliffgrid-3x5');
  const limits = [
    'A teaching analogue: a tabular softmax policy on tiny deterministic tasks. No language model, no KL penalty, no clipping, no reference policy. Nothing here measures real GRPO at scale.',
    `The headline before/after numbers each come from one training seed. The seed sweep shows the spread across ${seeds.n_training_seeds} seeds, but evaluation is still sampled from the same ${deep.evaluation.seeds.length} evaluation seeds.`,
    'Replay verifies a log against the rules. It cannot tell whether the task itself is the right task, and it cannot see aggregate gaming such as choosing which episodes to submit.',
    'Two hacks pass replay by design: a bandit log that rewrites both the arm and the payoff consistently, and hard-coding the public sequence target.',
    `Rare-success tasks waste most groups: CliffGrid spent ${cl.train.uninformative_groups} of ${cl.train.iterations} groups with zero variance.`,
    'Grades in the level READMEs are self-assessed. No external reviewer has scored this work.',
  ];
  return (
    <section id="limits" className="card window reveal" data-title="ROADMAP.md - not done">
      <p className="eyebrow">Limits and roadmap</p>
      <h2>What this does not show, and the backlog that is <em>still open</em>.</h2>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div>
          <h3>Threats to validity</h3>
          <ul className="list">{limits.map((x) => <li key={x}>{x}</li>)}</ul>
          <p className="hint">Full grading against a research rubric: <a href={blob('docs/research-review.md')}>docs/research-review.md</a>.</p>
        </div>
        <div>
          <h3>v1.1 backlog from ROADMAP.md</h3>
          <ol className="list roadmap">{roadmap.map((x, i) => {
            const done = x.includes('Done in this version');
            return <li key={i}><span className={`pill ${done ? 'good' : 'warn'}`}>{done ? 'done here' : 'not done'}</span> {x}</li>;
          })}</ol>
        </div>
      </div>
    </section>
  );
}

function Reproduce() {
  const quoted = Object.fromEntries([...readmeMd.matchAll(/(results_\w+\.json) byte-identical across two runs at sha256 ([0-9a-f]{64})/g)].map((m) => [m[1], m[2]]));
  const totalTests = Object.values(TESTS).reduce((a, b) => a + b, 0);
  return (
    <section id="reproduce" className="card window reveal" data-title="Terminal - python run_*.py">
      <p className="eyebrow">Reproduce it</p>
      <h2>Stdlib Python, no installs, every results file byte for byte.</h2>
      <ol className="steps" style={{ marginTop: 16 }}>
        <li><span className="n">1</span><div><b>Clone</b><div className="hint"><code>git clone {REPO}.git && cd rl-environments-and-verifiers</code></div></div></li>
        <li><span className="n">2</span><div><b>Run the {totalTests} tests</b><div className="hint"><code>for t in tests/test_*.py; do python3 $t; done</code></div>
          <div className="hint">{Object.entries(TESTS).map(([p, c]) => `${p.replace('tests/', '')}: ${c}`).join(' · ')}</div></div></li>
        <li><span className="n">3</span><div><b>Regenerate the results and diff</b><div className="hint"><code>python3 level-1-learn/run_learn.py && python3 level-2-build/run_build.py && python3 level-3-deep/run_deep.py && python3 level-3-deep/run_seeds.py && git diff --exit-code</code></div></div></li>
        <li><span className="n">4</span><div><b>Rebuild this page</b><div className="hint"><code>cd site && npm ci && npm run build</code></div><div className="hint">The build first runs <span className="mono">rl.check.mjs</span>, which fails unless the JavaScript port reproduces every recorded result.</div></div></li>
      </ol>
      <div style={{ overflowX: 'auto', marginTop: 18 }}>
        <table>
          <thead><tr><th>Results file</th><th>sha256 of the committed file (computed at build)</th><th>README quotes</th></tr></thead>
          <tbody>
            {Object.entries(HASHES).map(([p, h]) => {
              const q = quoted[p.split('/')[1]];
              return <tr key={p}><td className="mono">{p}</td><td className="mono hash">{h}</td><td>{q ? <span className={`pill ${q === h ? 'good' : 'bad'}`}>{q === h ? 'matches' : 'differs'}</span> : <span className="hint">new in this version</span>}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <div className="docs" style={{ marginTop: 20 }}>
        {[['SPEC.md', 'Spec', 'Scope and acceptance'], ['level-2-build/BUILD-SPEC.md', 'Build spec', 'Rules and hand-computed oracles'], ['level-3-deep/DEEP-SPEC.md', 'Deep spec', 'Method and pre-stated directions'],
          ['level-2-build/README.md', 'Post-mortems', 'Reward hacking, in full'], ['ROADMAP.md', 'Roadmap', 'The v1.1 backlog'], ['docs/research-review.md', 'Research review', 'Rubric grades and gaps']].map(([p, t, d]) => <a key={p} href={blob(p)}><b>{t}</b><small>{d}</small></a>)}
      </div>
    </section>
  );
}
