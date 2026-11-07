// Line-by-line JavaScript port of the repo's Python code, so the page can run it live.
// Sources: level-1-learn/rl_learn.py, level-2-build/rl_build.py, level-2-build/run_build.py,
// level-3-deep/rl_deep.py. rl.check.mjs (run by `npm run build`) asserts that this port
// reproduces every recorded results file exactly, so a live run with the recorded settings
// is the recorded run.

// ------------------------------------------------------------ Python's random.Random
// MT19937 seeded the way CPython seeds it from an int (init_by_array over 32-bit words).
export class PyRandom {
  constructor(seed) {
    const mt = (this.mt = new Uint32Array(624));
    mt[0] = 19650218;
    for (let i = 1; i < 624; i++) mt[i] = (Math.imul(1812433253, mt[i - 1] ^ (mt[i - 1] >>> 30)) + i) >>> 0;
    let n = Math.abs(seed);
    const key = [];
    do { key.push(n % 4294967296); n = Math.floor(n / 4294967296); } while (n > 0);
    let i = 1, j = 0;
    for (let k = Math.max(624, key.length); k; k--) {
      mt[i] = ((mt[i] ^ Math.imul(mt[i - 1] ^ (mt[i - 1] >>> 30), 1664525)) + key[j] + j) >>> 0;
      i++; j++;
      if (i >= 624) { mt[0] = mt[623]; i = 1; }
      if (j >= key.length) j = 0;
    }
    for (let k = 623; k; k--) {
      mt[i] = ((mt[i] ^ Math.imul(mt[i - 1] ^ (mt[i - 1] >>> 30), 1566083941)) - i) >>> 0;
      i++;
      if (i >= 624) { mt[0] = mt[623]; i = 1; }
    }
    mt[0] = 0x80000000;
    this.idx = 624;
  }
  genrand() {
    const mt = this.mt;
    if (this.idx >= 624) {
      for (let k = 0; k < 624; k++) {
        const y = (mt[k] & 0x80000000) | (mt[(k + 1) % 624] & 0x7fffffff);
        mt[k] = mt[(k + 397) % 624] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
      }
      this.idx = 0;
    }
    let y = mt[this.idx++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }
  random() {
    const a = this.genrand() >>> 5, b = this.genrand() >>> 6;
    return (a * 67108864 + b) / 9007199254740992;
  }
  getrandbits(k) { return this.genrand() >>> (32 - k); } // k <= 32
  randrange(n) { // CPython _randbelow_with_getrandbits
    const k = n.toString(2).length;
    let r = this.getrandbits(k);
    while (r >= n) r = this.getrandbits(k);
    return r;
  }
}

// CPython 3.12 sum() over floats: Neumaier compensated summation.
export function fsum(xs) {
  let s = 0, c = 0;
  for (const x of xs) {
    const t = s + x;
    c += Math.abs(s) >= Math.abs(x) ? (s - t) + x : (x - t) + s;
    s = t;
  }
  return c && Number.isFinite(c) ? s + c : s;
}
export const round6 = (x) => Number(x.toFixed(6)) + 0; // + 0 turns -0 into 0
const isum = (xs) => xs.reduce((a, b) => a + b, 0); // integer sums are exact

// ------------------------------------------------------------ grids (rl_build.py)
export const ACTIONS = [[-1, 0], [0, 1], [1, 0], [0, -1]];
export const ACTION_NAMES = ['up', 'right', 'down', 'left'];
export const ARROWS = ['↑', '→', '↓', '←'];
const key = (s) => `${s[0]},${s[1]}`;
const eq = (a, b) => a[0] === b[0] && a[1] === b[1];

function spec(name, rows, cols, start, goal, bad, walls, badBonus, badName) {
  return { name, rows, cols, start, goal, bad, walls, badBonus, badName, maxSteps: 20 };
}
export const GW = spec('gridworld-4x4', 4, 4, [0, 0], [3, 3], [[3, 0]], [[1, 1], [1, 2]], -5, 'pit');
export const CLIFF = spec('cliffgrid-3x5', 3, 5, [2, 0], [2, 4], [[2, 1], [2, 2], [2, 3]], [], -10, 'cliff');
export const GRID_SPECS = { 'gridworld-4x4': GW, 'cliffgrid-3x5': CLIFF };
const isBad = (sp, s) => sp.bad.some((b) => eq(b, s));
const isWall = (sp, s) => sp.walls.some((b) => eq(b, s));
export const gridIsTerminal = (sp, s) => eq(s, sp.goal) || isBad(sp, s);

export function gridStep(sp, state, action) {
  const [dr, dc] = ACTIONS[action];
  let nxt = [state[0] + dr, state[1] + dc];
  if (!(nxt[0] >= 0 && nxt[0] < sp.rows && nxt[1] >= 0 && nxt[1] < sp.cols) || isWall(sp, nxt)) nxt = state;
  let reward = -1;
  if (eq(nxt, sp.goal)) reward += 10;
  else if (isBad(sp, nxt)) reward += sp.badBonus;
  return [nxt, reward, gridIsTerminal(sp, nxt)];
}

export function gridRunEpisode(sp, policy, maxSteps = sp.maxSteps) {
  let state = sp.start, done = false;
  const states = [state], actions = [], rewards = [];
  for (let i = 0; i < maxSteps; i++) {
    const a = policy(state, i);
    let r;
    [state, r, done] = gridStep(sp, state, a);
    actions.push(a); rewards.push(r); states.push(state);
    if (done) break;
  }
  return { states: states.map((s) => [...s]), actions, rewards, return: isum(rewards), steps: actions.length,
    reached_goal: eq(states.at(-1), sp.goal), ended_in_bad: isBad(sp, states.at(-1)), terminal: done };
}

export function gridVerify(sp, traj) {
  const reasons = [];
  const { states, actions, rewards } = traj;
  if (!states.length || !eq(states[0], sp.start)) return [false, ['bad_start']];
  if (states.length !== actions.length + 1 || rewards.length !== actions.length) return [false, ['length_mismatch']];
  if (actions.length > sp.maxSteps) reasons.push('too_many_steps');
  let total = 0;
  actions.forEach((a, i) => {
    const [nxt, reward, done] = gridStep(sp, states[i], a);
    if (!eq(nxt, states[i + 1])) reasons.push('illegal_transition');
    if (reward !== rewards[i]) reasons.push('reward_mismatch');
    total += reward;
    if (done && i !== actions.length - 1) reasons.push('steps_after_terminal');
  });
  const last = states.at(-1);
  if (traj.reached_goal && !eq(last, sp.goal)) reasons.push('goal_claim_false');
  if (gridIsTerminal(sp, last) !== Boolean(traj.terminal)) reasons.push('terminal_mismatch');
  if (total !== traj.return) reasons.push('return_mismatch');
  return [!reasons.length, reasons];
}

export const gridCells = (sp) => {
  const out = [];
  for (let r = 0; r < sp.rows; r++) for (let c = 0; c < sp.cols; c++) if (!isWall(sp, [r, c])) out.push([r, c]);
  return out;
};

export function gridValueIteration(sp, tol = 1e-12) {
  const states = gridCells(sp);
  let V = Object.fromEntries(states.map((s) => [key(s), 0]));
  for (let sweeps = 1; ; sweeps++) {
    let delta = 0;
    const nw = { ...V };
    for (const s of states) {
      if (gridIsTerminal(sp, s)) { nw[key(s)] = 0; continue; }
      nw[key(s)] = Math.max(...[0, 1, 2, 3].map((a) => { const [n, r] = gridStep(sp, s, a); return r + V[key(n)]; }));
      delta = Math.max(delta, Math.abs(nw[key(s)] - V[key(s)]));
    }
    V = nw;
    if (delta < tol) return { V, sweeps };
  }
}

export const gridGreedyPolicy = (sp, V) => (state) => {
  let best = null, bestV = null;
  for (let a = 0; a < 4; a++) {
    const [n, r] = gridStep(sp, state, a);
    const v = r + V[key(n)];
    if (bestV === null || v > bestV) { best = a; bestV = v; }
  }
  return best;
};

export function gridEvaluateRandom(sp, seed, episodes) {
  const rng = new PyRandom(seed);
  const rets = [], steps = [];
  let goals = 0, bads = 0;
  for (let e = 0; e < episodes; e++) {
    const t = gridRunEpisode(sp, () => rng.randrange(4));
    rets.push(t.return); steps.push(t.steps);
    goals += t.reached_goal ? 1 : 0; bads += t.ended_in_bad ? 1 : 0;
  }
  return { episodes, mean_return: round6(isum(rets) / episodes), mean_steps: round6(isum(steps) / episodes),
    goal_rate: round6(goals / episodes), bad_rate: round6(bads / episodes) };
}

const argmaxFirst = (vals) => vals.reduce((b, v, i) => (v > vals[b] ? i : b), 0);

export function gridTrainQ(sp, seed, episodes, alpha = 0.1, epsilon = 0.1) {
  const rng = new PyRandom(seed);
  const Q = new Map();
  const q = (s, a) => Q.get(`${key(s)}|${a}`) ?? 0;
  for (let e = 0; e < episodes; e++) {
    let state = sp.start;
    for (let i = 0; i < sp.maxSteps; i++) {
      const action = rng.random() < epsilon ? rng.randrange(4) : argmaxFirst([0, 1, 2, 3].map((a) => q(state, a)));
      const [nxt, reward, done] = gridStep(sp, state, action);
      const target = done ? reward : reward + Math.max(...[0, 1, 2, 3].map((a) => q(nxt, a)));
      Q.set(`${key(state)}|${action}`, q(state, action) + alpha * (target - q(state, action)));
      state = nxt;
      if (done) break;
    }
  }
  return Object.fromEntries([...Q].map(([k, v]) => [k, round6(v)])); // rounded, as the Python returns it
}

export const gridQGreedy = (sp, Q) => gridRunEpisode(sp, (s) => argmaxFirst([0, 1, 2, 3].map((a) => Q[`${key(s)}|${a}`] ?? 0)));

// ------------------------------------------------------------ bandit
export const PAYOFFS = [2, 5, 3];
export const BANDIT_HORIZON = 10;
const BANDIT_BEST = 1;
export function banditRunEpisode(policy) {
  const states = [0], actions = [], rewards = [];
  for (let t = 0; t < BANDIT_HORIZON; t++) {
    const arm = policy(t, [...actions]);
    actions.push(arm); rewards.push(PAYOFFS[arm]); states.push(t + 1);
  }
  return { states, actions, rewards, return: isum(rewards), steps: actions.length,
    reached_goal: actions.every((a) => a === BANDIT_BEST), terminal: true };
}
export function banditVerify(traj) {
  const reasons = [];
  const { states, actions, rewards } = traj;
  if (!states.length || states[0] !== 0) return [false, ['bad_start']];
  if (actions.length !== BANDIT_HORIZON || states.length !== BANDIT_HORIZON + 1 || rewards.length !== BANDIT_HORIZON) return [false, ['length_mismatch']];
  let total = 0;
  actions.forEach((arm, t) => {
    if (states[t + 1] !== t + 1) reasons.push('illegal_transition');
    if (![0, 1, 2].includes(arm)) { reasons.push('illegal_action'); return; }
    if (PAYOFFS[arm] !== rewards[t]) reasons.push('reward_mismatch');
    total += PAYOFFS[arm];
  });
  if (traj.reached_goal && !actions.every((a) => a === BANDIT_BEST)) reasons.push('goal_claim_false');
  if (total !== traj.return) reasons.push('return_mismatch');
  return [!reasons.length, reasons];
}
export function banditEvaluateRandom(seed, episodes) {
  const rng = new PyRandom(seed);
  const rets = [], best = [];
  for (let e = 0; e < episodes; e++) {
    const t = banditRunEpisode(() => rng.randrange(3));
    rets.push(t.return); best.push(t.actions.filter((a) => a === BANDIT_BEST).length / BANDIT_HORIZON);
  }
  return { episodes, mean_return: round6(isum(rets) / episodes), mean_best_arm_rate: round6(fsum(best) / episodes) };
}

// ------------------------------------------------------------ sequence
export const TARGET = [2, 0, 1, 2];
export const SEQ_CORRECT = 3, SEQ_WRONG = -2;
export const SEQ_SYMBOLS = [0, 1, 2, 3];
export function seqRunEpisode(policy) {
  const states = [0], actions = [], rewards = [];
  for (let t = 0; t < TARGET.length; t++) {
    const sym = policy(t, [...actions]);
    actions.push(sym); rewards.push(sym === TARGET[t] ? SEQ_CORRECT : SEQ_WRONG); states.push(t + 1);
  }
  const correct = actions.filter((a, t) => a === TARGET[t]).length;
  return { states, actions, rewards, return: isum(rewards), steps: actions.length,
    reached_goal: correct === TARGET.length, accuracy: round6(correct / TARGET.length), terminal: true };
}
export function seqVerify(traj) {
  const reasons = [];
  const { states, actions, rewards } = traj;
  if (!states.length || states[0] !== 0) return [false, ['bad_start']];
  if (actions.length !== TARGET.length || states.length !== TARGET.length + 1 || rewards.length !== TARGET.length) return [false, ['length_mismatch']];
  let total = 0;
  actions.forEach((sym, t) => {
    if (states[t + 1] !== t + 1) reasons.push('illegal_transition');
    const expected = sym === TARGET[t] ? SEQ_CORRECT : SEQ_WRONG;
    if (expected !== rewards[t]) reasons.push('reward_mismatch');
    total += expected;
  });
  const correct = actions.filter((a, t) => a === TARGET[t]).length;
  if (traj.reached_goal && correct !== TARGET.length) reasons.push('goal_claim_false');
  if (total !== traj.return) reasons.push('return_mismatch');
  return [!reasons.length, reasons];
}
export function seqEvaluateRandom(seed, episodes) {
  const rng = new PyRandom(seed);
  const rets = [], accs = [];
  for (let e = 0; e < episodes; e++) {
    const t = seqRunEpisode(() => rng.randrange(4));
    rets.push(t.return); accs.push(t.accuracy);
  }
  return { episodes, mean_return: round6(isum(rets) / episodes), mean_accuracy: round6(fsum(accs) / episodes) };
}

export const TASKS = ['gridworld-4x4', 'cliffgrid-3x5', 'bandit-3arm-deterministic', 'sequence-memory-4'];
export const TASK_LABEL = { 'gridworld-4x4': 'GridWorld 4x4', 'cliffgrid-3x5': 'CliffGrid 3x5', 'bandit-3arm-deterministic': '3-arm bandit', 'sequence-memory-4': 'Sequence memory 4' };
export function verify(task, traj) {
  if (GRID_SPECS[task]) return gridVerify(GRID_SPECS[task], traj);
  return task === 'bandit-3arm-deterministic' ? banditVerify(traj) : seqVerify(traj);
}
const clone = (x) => JSON.parse(JSON.stringify(x));

// ------------------------------------------------------------ grader scenarios (run_learn.py, run_build.py)
// Each scenario is a recorded log plus the reason the verifier must give (null means it must pass).
export function graderScenarios(task, level = 'build') {
  const out = [];
  const add = (name, traj, expect) => out.push({ name, traj, expect });
  if (GRID_SPECS[task]) {
    const sp = GRID_SPECS[task];
    const greedy = gridRunEpisode(sp, gridGreedyPolicy(sp, gridValueIteration(sp).V));
    add('valid_greedy', greedy, null);
    let t = clone(greedy); t.rewards[0] = 0; add('tampered_reward', t, 'reward_mismatch');
    if (level === 'learn') { t = clone(greedy); t.states[2] = [3, 3]; add('teleport', t, 'illegal_transition'); }
    t = clone(greedy); t.return = greedy.return + 5; add('wrong_return_claim', t, 'return_mismatch');
    if (sp === GW) {
      const pit = gridRunEpisode(sp, (s, i) => (i < 3 ? 2 : 0));
      t = clone(pit); t.reached_goal = true; add('false_goal_claim', t, 'goal_claim_false');
      if (level === 'learn') add('pit_trajectory_valid', pit, null);
    } else {
      const cliff = gridRunEpisode(sp, () => 1);
      t = clone(cliff); t.states[1] = [1, 0]; t.rewards[0] = -1; t.return = -1; t.terminal = false;
      add('cliff_laundering', t, 'illegal_transition');
    }
  } else if (task === 'bandit-3arm-deterministic') {
    const opt = banditRunEpisode(() => 1);
    add('valid_optimal', opt, null);
    const forged = banditRunEpisode(() => 0);
    forged.rewards = Array(10).fill(5); forged.return = 50; forged.reached_goal = true;
    add('tampered_reward', forged, 'reward_mismatch');
    const t = clone(opt); t.return = 55; add('wrong_return_claim', t, 'return_mismatch');
    add('payoff_forgery', clone(forged), 'reward_mismatch');
  } else {
    const opt = seqRunEpisode((i) => TARGET[i]);
    add('valid_perfect', opt, null);
    const claimed = seqRunEpisode(() => 0);
    claimed.rewards = [3, 3, 3, 3]; claimed.return = 12; claimed.reached_goal = true;
    add('tampered_reward', claimed, 'reward_mismatch');
    const t = clone(opt); t.return = 15; add('wrong_return_claim', t, 'return_mismatch');
    add('reward_claiming_without_recall', clone(claimed), 'reward_mismatch');
  }
  return out;
}

export function gradeScenario(task, s) {
  const [ok, reasons] = verify(task, s.traj);
  const passed = s.expect === null ? ok : !ok && reasons.includes(s.expect);
  return { ok, reasons, passed_as_expected: passed };
}

// ------------------------------------------------------------ Deep: GRPO-style RLVR (rl_deep.py)
export const GROUP = 16;
export const EVAL_SEEDS = [9101, 9102, 9103, 9104, 9105];
export const EVAL_EPISODES_PER_SEED = 100;
export const N_ACTIONS = { 'gridworld-4x4': 4, 'cliffgrid-3x5': 4, 'bandit-3arm-deterministic': 3, 'sequence-memory-4': 4 };

export function softmax(logits) {
  const m = Math.max(...logits);
  const ex = logits.map((x) => Math.exp(x - m));
  const total = fsum(ex);
  return ex.map((e) => e / total);
}

export function sampleAction(rng, probs) {
  const x = rng.random();
  let acc = 0;
  for (let i = 0; i < probs.length; i++) { acc += probs[i]; if (x < acc) return i; }
  return probs.length - 1;
}

export function groupAdvantages(rewards) {
  const n = rewards.length;
  const mean = fsum(rewards) / n;
  const std = Math.sqrt(fsum(rewards.map((r) => (r - mean) * (r - mean))) / n);
  if (std < 1e-12) return [rewards.map(() => 0), mean, std];
  return [rewards.map((r) => (r - mean) / std), mean, std];
}

export function meanBaselineAdvantages(rewards) {
  const n = rewards.length;
  const mean = fsum(rewards) / n;
  const std = Math.sqrt(fsum(rewards.map((r) => (r - mean) * (r - mean))) / n);
  return [rewards.map((r) => r - mean), mean, std];
}

export function applyGroupUpdate(theta, episodes, advantages, lr, groupSize) {
  const grad = new Map();
  episodes.forEach((steps, e) => {
    const adv = advantages[e];
    if (adv === 0) return;
    for (const [state, action, probs] of steps) {
      if (!grad.has(state)) grad.set(state, probs.map(() => 0));
      const g = grad.get(state);
      for (let k = 0; k < probs.length; k++) g[k] += adv * (k === action ? 1 - probs[k] : -probs[k]);
    }
  });
  for (const [state, g] of grad) {
    const logits = theta[state];
    for (let k = 0; k < g.length; k++) logits[k] += (lr * g[k]) / groupSize;
  }
}

export function scoreEpisodes(successes, returns) {
  const n = returns.length;
  const mean = isum(returns) / n;
  const variance = fsum(returns.map((r) => (r - mean) * (r - mean))) / n;
  const passAt = (k) => {
    let blocks = 0, hit = 0;
    for (let i = 0; i + k <= n; i += k) { blocks++; if (successes.slice(i, i + k).some(Boolean)) hit++; }
    return blocks ? round6(hit / blocks) : 0;
  };
  return { episodes: n, mean_return: round6(mean), return_variance: round6(variance), success_rate: round6(isum(successes) / n),
    pass_at_1: passAt(1), pass_at_3: passAt(3), pass_at_5: passAt(5) };
}

// Unbiased pass@k, 1 - C(n-c,k)/C(n,k) (Chen et al. 2021), computed as a running product.
export function passAtKUnbiased(n, c, k) {
  if (n - c < k) return 1;
  let ratio = 1;
  for (let i = 0; i < k; i++) ratio *= (n - c - i) / (n - i);
  return round6(1 - ratio);
}

// Theta is keyed by state: "r,c" for grids, the pull index 0 for the bandit, the position for the sequence.
export function initialTheta(task) {
  const theta = {};
  if (GRID_SPECS[task]) for (const s of gridCells(GRID_SPECS[task])) theta[key(s)] = [0, 0, 0, 0];
  else if (task === 'bandit-3arm-deterministic') theta[0] = [0, 0, 0];
  else for (let t = 0; t < 4; t++) theta[t] = [0, 0, 0, 0];
  return theta;
}

export function sampleEpisode(task, theta, rng) {
  const steps = [];
  const pick = (state) => {
    const probs = softmax(theta[state]);
    const a = sampleAction(rng, probs);
    steps.push([state, a, probs]);
    return a;
  };
  let traj;
  if (GRID_SPECS[task]) traj = gridRunEpisode(GRID_SPECS[task], (s) => pick(key(s)));
  else if (task === 'bandit-3arm-deterministic') traj = banditRunEpisode(() => pick(0));
  else traj = seqRunEpisode((t) => pick(t));
  if (!verify(task, traj)[0]) throw new Error('sampler produced an unverified trajectory');
  return [steps, traj];
}

const episodeReward = (traj, mode) => (mode === 'success' ? (traj.reached_goal ? 1 : 0) : traj.return);

export function train(task, mode, iterations, lr, seed, { group = GROUP, advantage = 'group', curve = null } = {}) {
  const rng = new PyRandom(seed);
  const theta = initialTheta(task);
  const advFn = advantage === 'group' ? groupAdvantages : meanBaselineAdvantages;
  let informative = 0;
  for (let it = 0; it < iterations; it++) {
    const episodes = [], rewards = [];
    for (let g = 0; g < group; g++) {
      const [steps, traj] = sampleEpisode(task, theta, rng);
      episodes.push(steps); rewards.push(episodeReward(traj, mode));
    }
    const [adv, mean, std] = advFn(rewards);
    if (std >= 1e-12) informative++;
    if (curve) curve.push([round6(mean), std >= 1e-12 ? 1 : 0]);
    applyGroupUpdate(theta, episodes, adv, lr, group);
  }
  return [theta, { iterations, group_size: group, episodes_sampled: iterations * group, informative_groups: informative, uninformative_groups: iterations - informative }];
}

export function evaluate(task, theta) {
  const successes = [], returns = [], perSeed = [];
  for (const seed of EVAL_SEEDS) {
    const rng = new PyRandom(seed);
    const s = [], r = [];
    for (let e = 0; e < EVAL_EPISODES_PER_SEED; e++) {
      const [, traj] = sampleEpisode(task, theta, rng);
      s.push(traj.reached_goal ? 1 : 0); r.push(traj.return);
    }
    perSeed.push(scoreEpisodes(s, r));
    successes.push(...s); returns.push(...r);
  }
  return { aggregate: scoreEpisodes(successes, returns), per_seed: perSeed };
}

export function greedyEpisode(task, theta) {
  const best = (logits) => argmaxFirst(logits);
  if (GRID_SPECS[task]) {
    const sp = GRID_SPECS[task];
    const t = gridRunEpisode(sp, (s) => best(theta[key(s)]));
    return { actions: t.actions, return: t.return, steps: t.steps, reached_goal: t.reached_goal, verified: gridVerify(sp, t)[0], states: t.states };
  }
  if (task === 'bandit-3arm-deterministic') {
    const arm = best(theta[0]);
    const t = banditRunEpisode(() => arm);
    return { actions: t.actions, return: t.return, steps: t.steps, reached_goal: t.reached_goal, verified: banditVerify(t)[0] };
  }
  const t = seqRunEpisode((i) => best(theta[i]));
  return { actions: t.actions, return: t.return, steps: t.steps, reached_goal: t.reached_goal, accuracy: t.accuracy, verified: seqVerify(t)[0] };
}

export const thetaJson = (theta) => Object.fromEntries(Object.keys(theta).sort().map((k) => [k, theta[k].map(round6)]));
