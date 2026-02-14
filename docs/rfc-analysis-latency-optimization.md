# RFC: Analysis Latency Optimization

**Author:** Claude
**Status:** Draft
**Created:** 2026-02-03

## Problem Statement

RageCheck analysis requests take 7-35 seconds for cache misses. DB logging adds 100-500ms to every request, even though it doesn't affect the response data.

---

## Proposed Changes

### 1. Fire-and-Forget Logging for Failed Analyses

**File:** `src/app/api/analyze/route.ts`

**Current behavior:**
```typescript
await logAnalysis({ url, success: false, error: "..." });
return NextResponse.json({ success: false, error: "..." });
```

**Proposed behavior:**
```typescript
logAnalysis({ url, success: false, error: "..." })
  .catch(e => console.error("Log failed:", e));
return NextResponse.json({ success: false, error: "..." });
```

**Rationale:**
- Failed analyses don't populate the cache (cache requires `success=true AND score IS NOT NULL`)
- No downstream dependency on the INSERT completing
- Saves 100-500ms on ~15-20% of requests (extraction failures)

**Risk:** Logging could fail silently. Mitigated by `.catch()` logging to console.

---

### 2. Parallel Blob Storage for Image Uploads

**File:** `src/app/api/analyze/route.ts`

**Current behavior:**
```typescript
const blobUrl = await saveUploadedImage(base64, filename);
await logAnalysis({...});
return NextResponse.json({ ..., image: blobUrl });
```

**Proposed behavior:**
```typescript
const blobPromise = saveUploadedImage(base64, filename);
const logPromise = logAnalysis({...});

// Wait for blob (needed in response) but not log
const blobUrl = await blobPromise;
logPromise.catch(e => console.error("Log failed:", e));

return NextResponse.json({ ..., image: blobUrl });
```

**Rationale:**
- Blob URL is needed in response, but logging is not
- Parallelizing saves 100-500ms on image uploads

**Risk:** Logging could fail silently.

---

## Implementation Plan

| Change | Effort | Latency Saved | Risk |
|--------|--------|---------------|------|
| 1. Fire-and-forget (failures) | 15 min | 100-500ms (15% of requests) | Low |
| 2. Parallel blob storage | 15 min | 100-500ms (image uploads) | Low |

---

## Open Questions

1. **Logging reliability:** Is fire-and-forget acceptable, or do we need Vercel's `waitUntil()` for guaranteed delivery?
