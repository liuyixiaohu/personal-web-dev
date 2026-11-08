import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';
import { EMBEDDING_MODEL, EMBEDDING_REVISION } from './intentRanking';

let extractorPromise: Promise<FeatureExtractionPipeline> | undefined;
const createExtractor = pipeline as unknown as (
  task: 'feature-extraction',
  model: string,
  options: { dtype: 'q8'; revision: string },
) => Promise<FeatureExtractionPipeline>;

self.onmessage = async (message: MessageEvent<{ id: number; text: string }>) => {
  const { id, text } = message.data;
  try {
    extractorPromise ??= createExtractor('feature-extraction', EMBEDDING_MODEL, {
      dtype: 'q8',
      revision: EMBEDDING_REVISION,
    });
    const extractor = await extractorPromise;
    const result = await extractor(text, { pooling: 'mean', normalize: true });
    self.postMessage({ id, vector: Array.from(result.data) });
  } catch (error) {
    extractorPromise = undefined;
    self.postMessage({ id, error: error instanceof Error ? error.message : 'Embedding failed' });
  }
};
