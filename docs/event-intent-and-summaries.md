# Event summaries and Current intent

The daily Fetch Events action keeps the public catalog. After merging Luma's
list data, it requests the detail for new events and for summaries last checked
at least seven days ago. Gemini writes one factual English sentence from the
detail description. If the detail has no concrete content, the event has no
summary. Unchanged descriptions reuse the cached sentence. A failed detail
request keeps any prior sentence and retries on the next run.

## Setup

Add `GEMINI_API_KEY` as a **GitHub Actions repository secret**. The default
summary model is `gemini-3.5-flash-lite`; `GEMINI_SUMMARY_MODEL` can override it
in the job environment if needed. Then run **Fetch Events** manually once to
backfill the catalog. The job still updates normal event data when the secret
is absent, but new summaries remain unavailable.

The key stays in GitHub Actions. It is not included in the public JSON or
browser bundle. Summary requests are grouped in batches of eight to reduce
request count. Initial backfill uses more requests than a typical daily update.

## Matching

The daily job embeds each published summary using
`Xenova/all-MiniLM-L6-v2` and publishes normalized vectors. Only changed
summaries are re-embedded. When someone types a Current intent, their browser
downloads the same model and computes a query vector locally. Their text is
never stored or sent to the site, Gemini, or Hugging Face.

Within each Pacific date, the score is 75% summary cosine similarity, 20%
summary word coverage, and 5% title word coverage. Title wording therefore
cannot dominate a factual summary. Events without summaries can receive only
the small title word score. If vectors or the model are unavailable, word
coverage still works. With a blank intent, start-time ordering is unchanged.
Dates and existing filters always retain their current behavior.
