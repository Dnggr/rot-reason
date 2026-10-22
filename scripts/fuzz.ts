// scripts/fuzz.ts — fuzz CLI: `npm run fuzz -- [runs=1000] [seed=1]`; exits 1 on any failure and prints the seed + history to replay it
import { loadStory } from '../src/story/index'
import { runFuzz } from './fuzzRun'
async function main(): Promise<void> {
  const runs = Number(process.argv[2] ?? 1000)
  const seed = Number(process.argv[3] ?? 1)
  if (!Number.isInteger(runs) || runs < 1 || !Number.isInteger(seed)) {
    console.error('usage: npm run fuzz -- [runs] [seed]   (both integers, runs >= 1)')
    process.exit(2)
  }
  const r = runFuzz(await loadStory(), runs, seed)
  console.log(`fuzz: ${r.runs} runs, ${r.steps} steps, ${r.failures.length} failures`)
  console.log(`fuzz endings: ${JSON.stringify(r.endings)}`)
  if (r.never.length > 0) console.log(`fuzz info: never reached: ${r.never.join(', ')}`)
  for (const f of r.failures.slice(0, 5)) console.error(`fuzz FAIL ${f.why} | bg=${f.bg} seed=${f.seed} history=${JSON.stringify(f.history)}`)
  if (r.failures.length > 0) process.exit(1)
}
void main()
