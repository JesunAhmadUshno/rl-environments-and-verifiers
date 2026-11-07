// Known-answer check, run by `npm run build`: the JavaScript port in rl.js must reproduce the repo's
// recorded results exactly (Learn, Build, Deep, the seed sweep and the learning curves). Any drift fails the build.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as rl from './rl.js';

const read = (p) => JSON.parse(fs.readFileSync(new URL(`../../${p}`, import.meta.url)));
const learn = read('level-1-learn/results_learn.json');
const build = read('level-2-build/results_build.json');
const deep = read('level-3-deep/results_deep.json');
const seeds = read('level-3-deep/results_seeds.json');
const curves = read('level-3-deep/results_deep_curves.json');
const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]));
let n = 0;
const eq = (a, b, msg) => { assert.deepStrictEqual(a, b, msg); n++; };

// 0. The RNG is CPython's: random.Random(42).random() and randrange(4) sequence.
{ const r = new rl.PyRandom(42); eq(r.random(), 0.6394267984578837, 'PyRandom(42).random()'); }

// 1. Learn: verifier grading, value iteration, random baseline, Q-learning seed 7.
{
  const sc = rl.graderScenarios('gridworld-4x4', 'learn', learn.grader_scenarios.map((x) => x.name)).map((s) => ({ name: s.name, passed_as_expected: rl.gradeScenario('gridworld-4x4', s).passed_as_expected }));
  eq(sc, learn.grader_scenarios, 'learn grader scenarios');
  const { V } = rl.gridValueIteration(rl.GW);
  eq(V, learn.optimal_values, 'learn optimal values');
  const g = rl.gridRunEpisode(rl.GW, rl.gridGreedyPolicy(rl.GW, V));
  eq(pick(g, ['actions', 'rewards', 'return', 'steps', 'reached_goal']), pick(learn.greedy_policy, ['actions', 'rewards', 'return', 'steps', 'reached_goal']), 'learn greedy');
  const rp = rl.gridEvaluateRandom(rl.GW, 20261105, 200);
  eq({ episodes: rp.episodes, mean_return: rp.mean_return, mean_steps: rp.mean_steps, goal_rate: rp.goal_rate, pit_rate: rp.bad_rate }, learn.random_policy, 'learn random policy');
  const q = rl.gridQGreedy(rl.GW, rl.gridTrainQ(rl.GW, 7, 3000));
  eq(pick(q, ['actions', 'return', 'steps', 'reached_goal']), pick(learn.q_learning.greedy_after_training, ['actions', 'return', 'steps', 'reached_goal']), 'learn Q-learning seed 7');
}

// 2. Build: all 16 grader scenarios and the 4 hack attempts, value iteration, random baselines, Q-learning seed 11.
{
  const randomSeeds = { 'gridworld-4x4': 20261105, 'cliffgrid-3x5': 20261106, 'bandit-3arm-deterministic': 20261107, 'sequence-memory-4': 20261108 };
  for (const env of build.environments) {
    const names = env.grader_scenarios.map((x) => x.name);
    // the port's own scenario names match the file, except one bandit scenario it labels payoff_relabel
    const own = rl.graderScenarios(env.task).map((x) => x.name);
    eq(own.filter((x, i) => x !== names[i]), env.task === 'bandit-3arm-deterministic' ? ['payoff_relabel'] : [], `${env.task} scenario order`);
    const sc = rl.graderScenarios(env.task, 'build', names).map((s) => ({ name: s.name, passed_as_expected: rl.gradeScenario(env.task, s).passed_as_expected }));
    eq(sc, env.grader_scenarios, `${env.task} grader scenarios`);
    const hack = rl.graderScenarios(env.task, 'build', names).find((s) => env.hack_attempt.name.includes(s.name) || s.name === env.hack_attempt.name);
    eq(!rl.verify(env.task, hack.traj)[0], env.hack_attempt.verifier_caught, `${env.task} hack attempt caught`);
    const seed = randomSeeds[env.task];
    if (rl.GRID_SPECS[env.task]) {
      const sp = rl.GRID_SPECS[env.task];
      const { V } = rl.gridValueIteration(sp);
      eq(V, env.optimal_values, `${env.task} optimal values`);
      const g = rl.gridRunEpisode(sp, rl.gridGreedyPolicy(sp, V));
      eq(pick(g, ['actions', 'rewards', 'return', 'steps']), pick(env.greedy_policy, ['actions', 'rewards', 'return', 'steps']), `${env.task} greedy`);
      eq(rl.gridEvaluateRandom(sp, seed, 200), env.random_policy, `${env.task} random policy`);
    } else if (env.task === 'bandit-3arm-deterministic') {
      eq(rl.banditEvaluateRandom(seed, 200), env.random_policy, 'bandit random policy');
    } else {
      eq(rl.seqEvaluateRandom(seed, 200), env.random_policy, 'sequence random policy');
    }
  }
  const cliff = build.environments[1];
  const q = rl.gridQGreedy(rl.CLIFF, rl.gridTrainQ(rl.CLIFF, 11, 3000));
  eq(pick(q, ['actions', 'return', 'steps', 'reached_goal']), pick(cliff.q_learning.greedy_after_training, ['actions', 'return', 'steps', 'reached_goal']), 'cliff Q-learning seed 11');
  eq(build.grader_passed_total, 16, 'build grader total');
}

// 3. Deep: the 4 recorded GRPO-style runs and 2 ablations, bit for bit (before, after, per seed, theta, greedy, curves).
const strip = ({ states, ...g }) => g; // eslint-disable-line no-unused-vars
for (const t of deep.tasks) {
  const { seed, lr, iterations } = t.train;
  eq(rl.evaluate(t.task, rl.initialTheta(t.task)), t.before, `${t.task} before`);
  const curve = [];
  const [theta, info] = rl.train(t.task, t.reward_mode, iterations, lr, seed, { curve });
  eq({ seed, lr, ...info }, t.train, `${t.task} train info`);
  eq(rl.evaluate(t.task, theta), t.after, `${t.task} after`);
  eq(rl.thetaJson(theta), t.theta_after, `${t.task} theta`);
  eq(strip(rl.greedyEpisode(t.task, theta)), t.greedy_after, `${t.task} greedy`);
  eq(curve, curves.tasks[t.task], `${t.task} learning curve`);
  // unbiased pass@k against the Python seed-sweep file
  const pk = seeds.tasks[t.task].pass_at_k;
  for (const when of ['before', 'after']) {
    const a = t[when].aggregate, c = Math.round(a.success_rate * a.episodes);
    eq(Object.fromEntries([1, 3, 5].map((k) => [k, rl.passAtKUnbiased(a.episodes, c, k)])), Object.fromEntries(Object.entries(pk[when].unbiased)), `${t.task} unbiased pass@k ${when}`);
  }
}
for (const ab of deep.ablations) {
  const curve = [];
  const [theta, info] = rl.train(ab.task, ab.reward_mode, ab.train.iterations, ab.train.lr, ab.train.seed, { curve });
  eq({ seed: ab.train.seed, lr: ab.train.lr, ...info }, ab.train, `${ab.name} train info`);
  eq(rl.evaluate(ab.task, theta), ab.after, `${ab.name} after`);
  eq(strip(rl.greedyEpisode(ab.task, theta)), ab.greedy_after, `${ab.name} greedy`);
  eq(curve, curves.ablations[ab.name], `${ab.name} learning curve`);
}

// 4. Seed sweep: the live trainer's alternate seeds and the mean-baseline learner match Python too (spot-check 2 seeds per task).
for (const [task, b] of Object.entries(seeds.tasks)) {
  for (const i of [1, 9]) {
    for (const [arm, advantage] of [['grpo', 'group'], ['reinforce_mean_baseline', 'mean']]) {
      const run = b[arm].runs[i];
      const [theta, info] = rl.train(task, b.reward_mode, b.iterations, b.lr, run.seed, { advantage });
      const agg = rl.evaluate(task, theta).aggregate;
      eq({ seed: run.seed, success_rate: agg.success_rate, mean_return: agg.mean_return, informative_groups: info.informative_groups, greedy_reached_goal: rl.greedyEpisode(task, theta).reached_goal }, run, `${task} ${arm} seed ${run.seed}`);
    }
  }
}

console.log(`rl ok: ${n} known-answer checks match the recorded Python results`);
