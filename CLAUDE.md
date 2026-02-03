# RageCheck

A tool for analyzing emotional manipulation patterns in news articles and social media posts.

## Project Structure

- `src/app/` - Next.js app router pages and API routes
- `src/lib/` - Core libraries (scoring, LLM, extraction, DB)
- `src/components/` - React components
- `jobs/` - Python cron jobs for background processing

## Key Files

- `src/app/api/analyze/route.ts` - Main analysis endpoint
- `src/lib/llm.ts` - Claude API integration for LLM enhancement
- `src/lib/extract.ts` - URL content extraction (social platforms, articles)
- `src/lib/score.ts` - Rule-based scoring with 5-signal model
- `src/lib/db.ts` - PostgreSQL database functions

## Commands

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run lint    # Run ESLint
```

## Environment

Requires:
- `ANTHROPIC_API_KEY` - Claude API
- `DATABASE_URL` - PostgreSQL connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage (optional, for image uploads)

## Analysis Flow

1. URL submitted → check cache (24h TTL)
2. Cache miss → extract content (5-30s for complex sites)
3. Rule-based scoring (~10ms)
4. LLM enhancement with Claude Opus (~2-5s)
5. Log to DB, return results

Cache hits return in ~50-200ms.

## Loading State UX

Analysis takes 7-35 seconds for cache misses. The loading indicator is positioned inline directly below the input form (not far down the page) to keep it visible where users click.

**Implementation** (`src/app/page.tsx`):
- `loadingPhase` state (0-4) tracks elapsed time
- `useEffect` timer advances phase every few seconds while loading
- Phase messages: "Fetching article..." → "Extracting content..." → "Running pattern analysis..." → "AI is reviewing for nuance..." → "Complex content — almost there..."
- Stepped progress bar (4 segments) fills as phases advance
- Button shows spinner and is disabled during loading to prevent double-clicks
