import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { pipeline, env } from '@huggingface/transformers';
import { parseShelves, rankNotes, toMarkdown } from './core.mjs';
import { MODEL, REVISION, EMBEDDING_OPTIONS } from './model-config.mjs';

env.allowLocalModels = false;
const fixtures = [
  ['Fix the checkout page that crashes when the cart is empty', 'Fix'],
  ['Read the guide to training sentence embedding models', 'Read'],
  ['Pick up bananas and a carton of milk', 'Buy'],
  ['Book a dentist appointment for next week', 'Life'],
  ['Investigate the API returning a 500 error on login', 'Fix'],
  ['Save the article explaining how attention works', 'Read'],
  ['Order a replacement laptop charger', 'Buy'],
  ['Take the recycling bins out on Thursday', 'Life'],
  ['Repair the mobile menu that overlaps the header', 'Fix'],
  ['Read the novel recommended by the book club', 'Read'],
  ['Buy rice and coffee beans', 'Buy'],
  ['Schedule a morning walk with Sam', 'Life'],
];
const shelves = parseShelves(`Fix: bugs, broken software, errors, debugging and repairs
Read: articles, papers, books, documentation and things to learn
Buy: groceries, shopping, supplies and things to purchase
Life: personal chores, appointments, exercise and household errands`);
const extractor = await pipeline('feature-extraction', MODEL, { revision: REVISION, dtype: 'q8', device: 'cpu' });
const started = performance.now();
const output = await extractor([...fixtures.map(x => x[0]), ...shelves.map(x => `${x.name}: ${x.description}`)], EMBEDDING_OPTIONS);
assert.deepEqual(output.dims, [16,384]);
const rows = rankNotes(fixtures.map(x => x[0]), shelves, output.tolist());
assert.deepEqual(rows.map(x => shelves[x.suggested].name), fixtures.map(x => x[1]));
const preview = toMarkdown(rows, shelves);
assert.equal((preview.match(/^- /gm) || []).length, fixtures.length);
const receipt = { model: MODEL, revision: REVISION, runtime: 'Transformers.js 3.8.1 / CPU',
  fixture_count: fixtures.length, intended_top_suggestions: fixtures.length,
  review_count: rows.filter(x => x.review).length,
  inference_seconds_excluding_load: (performance.now() - started) / 1000,
  scope: 'Synthetic functional regression fixtures; not an accuracy benchmark or browser-runtime measurement.',
  results: rows.map(x => ({ text:x.text, suggested:shelves[x.suggested].name, similarity:x.score, review:x.review })) };
await writeFile('model-check.json', JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
