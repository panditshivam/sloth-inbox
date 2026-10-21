import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
import { rankNotes } from './core.mjs';
import { MODEL, REVISION, EMBEDDING_OPTIONS } from './model-config.mjs';

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
let extractor;

self.onmessage = async ({ data }) => {
  try {
    const { notes, shelves } = data;
    self.postMessage({ type: 'status', text: extractor ? 'Reading your notes…' : 'Loading the model. First visit downloads about 23 MB of weights…' });
    extractor ||= await pipeline('feature-extraction', MODEL, { revision: REVISION,
      dtype: 'q8', device: 'wasm', progress_callback: event => {
        if (event.status === 'progress' && event.file?.endsWith('.onnx'))
          self.postMessage({ type: 'status', text: `Loading the model… ${Math.round(event.progress)}%` });
      } });
    const started = performance.now();
    const output = await extractor([...notes, ...shelves.map(x => `${x.name}: ${x.description}`)],
      EMBEDDING_OPTIONS);
    const rows = rankNotes(notes, shelves, output.tolist());
    self.postMessage({ type: 'result', rows, elapsed: (performance.now() - started) / 1000,
      model: MODEL, revision: REVISION });
  } catch (error) {
    self.postMessage({ type: 'error', text: `Couldn’t sort this batch. ${error.message}. Check your connection for the first model download, then retry.` });
  }
};
