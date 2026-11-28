// Current-intent ranking for the events list. Must be called during component
// initialisation. The intent text is kept in the component and is never stored.
import {
  EMBEDDINGS_URL,
  EMBEDDING_MODEL,
  EMBEDDING_REVISION,
  type EmbeddingCatalog,
} from './intentRanking';

export type IntentStatus = 'idle' | 'loading' | 'ready' | 'fallback' | 'no-data';

export interface IntentSearchOptions {
  /** Current intent text, as typed by the user. */
  intent: () => string;
  /** Catalog version (`updated_at`), used to cache-bust the embeddings file. */
  catalogVersion: () => string;
}

export function createIntentSearch(options: IntentSearchOptions) {
  let status = $state<IntentStatus>('idle');
  let queryVector = $state.raw<number[] | undefined>(undefined);
  let embeddingCatalog = $state.raw<EmbeddingCatalog | undefined>(undefined);
  let catalogPromise: Promise<EmbeddingCatalog> | undefined;
  let worker: Worker | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sequence = 0;

  function loadEmbeddings(): Promise<EmbeddingCatalog> {
    catalogPromise ??= fetch(`${EMBEDDINGS_URL}?v=${encodeURIComponent(options.catalogVersion())}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Embedding data HTTP ${response.status}`);
        const data = (await response.json()) as EmbeddingCatalog;
        if (
          data.model !== EMBEDDING_MODEL ||
          data.revision !== EMBEDDING_REVISION ||
          data.dimension !== 384
        ) {
          throw new Error('Embedding model does not match the published event vectors');
        }
        return data;
      })
      .catch((error) => {
        catalogPromise = undefined;
        throw error;
      });
    return catalogPromise;
  }

  $effect(() => {
    const text = options.intent().trim();
    const id = ++sequence;
    if (timer) clearTimeout(timer);
    queryVector = undefined;
    if (!text) {
      status = 'idle';
      return;
    }
    status = 'loading';
    timer = setTimeout(async () => {
      try {
        const catalog = await loadEmbeddings();
        if (id !== sequence) return;
        embeddingCatalog = catalog;
        if (!Object.keys(catalog.items).length) {
          status = 'no-data';
          return;
        }
        worker ??= new Worker(new URL('./intentWorker.ts', import.meta.url), {
          type: 'module',
        });
        worker.onmessage = (
          message: MessageEvent<{ id: number; vector?: number[]; error?: string }>,
        ) => {
          if (message.data.id !== sequence) return;
          if (message.data.vector?.length === catalog.dimension) {
            queryVector = message.data.vector;
            status = 'ready';
          } else {
            status = 'fallback';
            if (message.data.error)
              console.error('Intent similarity unavailable:', message.data.error);
          }
        };
        worker.onerror = () => {
          if (id === sequence) status = 'fallback';
        };
        worker.postMessage({ id, text });
      } catch (error) {
        if (id === sequence) status = 'fallback';
        console.error('Intent similarity unavailable:', error);
      }
    }, 500);
  });

  $effect(() => () => {
    if (timer) clearTimeout(timer);
    worker?.terminate();
  });

  return {
    get status() {
      return status;
    },
    get queryVector() {
      return queryVector;
    },
    get embeddingCatalog() {
      return embeddingCatalog;
    },
  };
}
