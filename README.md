---
title: Sloth Inbox
emoji: 🦥
colorFrom: green
colorTo: yellow
sdk: static
app_file: index.html
pinned: false
license: apache-2.0
short_description: An open model sorts your brain dump in your browser.
---

# Sloth Inbox

A small chore deserves a small model. Paste one note per line, get suggested shelves, correct anything that looks wrong, then download a Markdown list.

[Open the Render demo](https://sloth-inbox.onrender.com/) · [GitHub source](https://github.com/panditshivam/sloth-inbox) · [Validation workflow](https://github.com/panditshivam/sloth-inbox/actions/workflows/validate.yml)

Built from scratch on 22 October 2026 for the Hacktoberfest Week 3 “Slow and Steady” challenge. This is a new project, not a pull request to an existing one.

## Try it

Open the Space, choose **Try an example**, then **Sort my inbox**. The first run downloads about 23 MB of quantized model weights plus runtime and tokenizer files. The model runs in your browser through WebAssembly. A web worker keeps inference off the main UI thread.

Each note gets a shelf dropdown. Low similarity or a close tie produces **Needs review**. Change any dropdown before exporting. Shelves are editable: use 2–8 lines in `Name: description` format. Inputs are limited to 60 notes of 300 characters each.

## Run locally

No build or API key is needed. With Python 3 installed, run this from the project directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`. An Internet connection is needed for the CDN runtime and the first model download. This is not a packaged offline app; reopening the hosted page requires a connection even if the browser has cached model files.

With Node.js 20+ installed, check the sorting and export logic:

```sh
node check.mjs
```

## Continuous validation and static hosting

The GitHub Actions workflow in `.github/workflows/validate.yml` checks the sorting logic, runs the pinned model on twelve synthetic regression fixtures, and packages the frontend. Its inference receipt and deployable files are saved as a seven-day workflow artifact. This is a functional regression check, not a new accuracy benchmark. The Node CPU runtime used in CI differs from the browser WebAssembly runtime.

To run the same model check with Node.js 22:

```sh
npm ci
npm test
npm run verify:model
npm run build
```

`dist/` contains only the frontend files; model weights are fetched by the browser. `render.yaml` configures a Render static site and waits for passing GitHub checks before automatically deploying updates. Render serves the frontend; user notes still stay in the browser. The build skips dependency installation because its validation and file packaging need only Node.js built-ins.

The public GitHub mirror is [panditshivam/sloth-inbox](https://github.com/panditshivam/sloth-inbox). The Hugging Face Space remains a working demo and source mirror.

## The open AI core

- Model: [Xenova/all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2), Apache 2.0. ONNX conversion of [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2).
- Model revision: `751bff37182d3f1213fa05d7196b954e230abad9`.
- Runtime: [Transformers.js](https://github.com/huggingface/transformers.js) 3.8.1, Apache 2.0; WebAssembly, q8 weights, one runtime thread.
- Mean pooling and normalization produce 384-dimensional embeddings. Dot products of normalized vectors give cosine similarities between each note and each shelf description.
- If the top score is below 0.25 or its lead over the runner-up is below 0.04, the note goes to review. These are simple heuristic defaults, not calibrated probabilities or validated confidence guarantees.
- Inputs are capped at 128 tokenizer tokens; character limits reduce but do not eliminate truncation, particularly for unusual text.

The model supplies semantic matching; there is no keyword routing fallback. A failed model load produces an error instead of a fake result. It does not generate prose or execute anything written in a note.

## Privacy and limits

Note text stays in browser memory. No application database, analytics or inference-server requests are used. The app fetches code from jsDelivr and model files from Hugging Face; these hosts see normal download metadata. Reloading clears the notes. Downloads and clipboard exports are actions you choose.

English works best. Negation, vague notes and multiple topics can confuse the model. Scores are similarities, not probabilities. Review every suggestion before relying on the list. The bundled example is synthetic. No measured human time-saving claim is made.

The sloth is an original SVG illustration made for this project. Source code and illustration are Apache 2.0; dependencies and model retain their own licences. AI tools assisted implementation and documentation.
