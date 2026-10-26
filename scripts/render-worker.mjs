import { parentPort, workerData } from 'node:worker_threads';
import { render, PeleError } from 'pele';

const results = workerData.diagrams.map(diagram => {
  try {
    const result = render(diagram.source, { ...workerData.options, idPrefix: `${workerData.options.idPrefix}-${diagram.index}` });
    return { ok: true, file: diagram.file, block: diagram.index, type: result.type, mermaidType: result.mermaidType, width: result.width, height: result.height, links: result.links.length, bytes: Buffer.byteLength(result.svg), ...(workerData.check ? {} : { svg: result.svg }) };
  } catch (error) {
    return { ok: false, file: diagram.file, block: diagram.index, code: error instanceof PeleError ? error.code : 'render-failed', message: error.message, line: error.line ? error.line + diagram.lineOffset : 0, column: error.column ?? 0, type: error.type ?? null };
  }
});
parentPort.postMessage(results);
