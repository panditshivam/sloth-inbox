export function parseInput(text) {
  const lines = text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  if (!lines.length) throw new Error('Add at least one note.');
  if (lines.length > 60) throw new Error('Keep it to 60 notes per batch.');
  if (lines.some(x => x.length > 300)) throw new Error('Keep each note under 300 characters.');
  return lines;
}

export function parseShelves(text) {
  const shelves = parseInput(text).map(line => {
    const [name, ...rest] = line.split(':');
    return { name: name.trim(), description: rest.join(':').trim() || name.trim() };
  });
  if (shelves.length < 2 || shelves.length > 8) throw new Error('Use 2–8 shelves, one per line.');
  if (new Set(shelves.map(x => x.name.toLowerCase())).size !== shelves.length)
    throw new Error('Give each shelf a different name.');
  if (shelves.some(x => !x.name)) throw new Error('Every shelf needs a name.');
  return shelves;
}

export function rankNotes(notes, shelves, vectors, threshold = 0.25, margin = 0.04) {
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const shelfVectors = vectors.slice(notes.length);
  return notes.map((text, i) => {
    const scores = shelfVectors.map((vector, index) => ({ index, score: dot(vectors[i], vector) }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    const top = scores[0];
    const review = top.score < threshold || top.score - scores[1].score < margin;
    return { text, shelf: review ? -1 : top.index, suggested: top.index,
      score: top.score, gap: top.score - scores[1].score, review };
  });
}

export function toMarkdown(rows, shelves) {
  return ['# My sorted inbox', '', ...[-1, ...shelves.map((_, i) => i)].flatMap(index => {
    const items = rows.filter(x => x.shelf === index);
    return items.length ? [`## ${index === -1 ? 'Needs review' : shelves[index].name}`, '',
      ...items.map(x => `- ${x.text.replace(/[\r\n]/g, ' ')}`), ''] : [];
  })].join('\n');
}
