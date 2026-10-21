import { parseInput, parseShelves, toMarkdown } from './core.mjs';
const $ = id => document.getElementById(id);
const worker = new Worker('./model-worker.mjs', { type: 'module' });
let rows = [], shelves = [], busy = false, pendingShelves;
const example = `Fix the checkout page that crashes when the cart is empty
Read the guide to training sentence embedding models
Pick up bananas and a carton of milk
Book a dentist appointment for next week
Investigate the API returning a 500 error on login
Save the article explaining how attention works
Order a replacement laptop charger
Take the recycling bins out on Thursday
Repair the mobile menu that overlaps the header
Read the novel recommended by the book club
Buy rice and coffee beans
Schedule a morning walk with Sam`;

function status(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
function setBusy(value) {
  busy = value;
  for (const id of ['sort','notes','shelves','example','clear']) $(id).disabled = value;
}
function render() {
  $('empty').hidden = rows.length > 0;
  $('results').hidden = !rows.length;
  $('export-actions').hidden = !rows.length;
  $('results').replaceChildren();
  $('count').textContent = `${rows.length} NOTES · ${rows.filter(x => x.shelf === -1).length} TO REVIEW`;
  $('markdown').value = toMarkdown(rows, shelves);
  rows.forEach((row, i) => {
    const article = document.createElement('article'); article.className = 'note-row';
    const text = document.createElement('p'); text.textContent = row.text;
    const controls = document.createElement('div'); controls.className = 'note-controls';
    const select = document.createElement('select'); select.setAttribute('aria-label', `Shelf for note ${i + 1}`);
    ['Needs review', ...shelves.map(x => x.name)].forEach((name, j) => {
      const option = document.createElement('option'); option.value = j - 1; option.textContent = name; select.append(option);
    });
    select.value = row.shelf;
    select.addEventListener('change', () => { row.shelf = Number(select.value); render(); });
    const score = document.createElement('span'); score.className = row.review ? 'review' : 'score';
    score.textContent = `Model suggests ${shelves[row.suggested].name} · similarity ${row.score.toFixed(2)}${row.review ? ' · uncertain' : ''}`;
    controls.append(select, score); article.append(text, controls); $('results').append(article);
  });
}
function invalidate() {
  if (rows.length) { rows = []; render(); status('Notes or shelves changed. Sort again to refresh your list.'); }
}
$('notes').addEventListener('input', invalidate);
$('shelves').addEventListener('input', invalidate);
$('example').onclick = () => { invalidate(); $('notes').value = example; status('Example loaded. These are synthetic notes, not personal data.'); };
$('sort').onclick = () => {
  if (busy) return;
  try {
    const notes = parseInput($('notes').value); pendingShelves = parseShelves($('shelves').value);
    setBusy(true); status('Starting…'); worker.postMessage({ notes, shelves: pendingShelves });
  } catch (error) { status(error.message, true); }
};
worker.onmessage = ({ data }) => {
  if (data.type === 'status') status(data.text);
  if (data.type === 'error') { status(data.text, true); setBusy(false); }
  if (data.type === 'result') {
    rows = data.rows; shelves = pendingShelves; render(); setBusy(false);
    status(`Sorted ${rows.length} notes in ${data.elapsed.toFixed(2)}s after model loading. Review, change a shelf, then export.`);
  }
};
worker.onerror = () => { status('The model worker could not start. Check your connection and reload to retry.', true); setBusy(false); };
$('clear').onclick = () => { $('notes').value = ''; rows = []; render(); status('Inbox cleared. Nothing was saved.'); };
$('download').onclick = () => {
  const url = URL.createObjectURL(new Blob([toMarkdown(rows, shelves)], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'sloth-inbox.md'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText(toMarkdown(rows, shelves)); status('Copied. One less loose end.'); }
  catch { status('Clipboard unavailable. Use Download Markdown instead.', true); }
};
