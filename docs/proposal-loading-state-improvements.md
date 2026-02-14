# Proposal: Loading State UX Improvements

**Problem:** Users think the page isn't working during the 7-35 second analysis wait.

**Research sources:**
- [LogRocket: Skeleton Loading Screen Design](https://blog.logrocket.com/ux-design/skeleton-loading-screen-design/)
- [NN/g: Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/)
- [UX Collective: Loading & Progress Indicators](https://uxdesign.cc/loading-progress-indicators-ui-components-series-f4b1fc35339a)
- [Boldist: Your Loading Spinner Is a UX Killer](https://boldist.co/usability/loading-spinner-ux-killer/)

---

## Current State

The current loading UI shows:
- A spinning indeterminate loader
- Static text: "Analyzing Patterns"
- Static subtext: "Our models are scanning for manipulative framing..."
- 5 signal bars with shimmer animation

**Issues:**
1. No indication of progress — users can't tell if it's 10% done or 90% done
2. No time expectation — users don't know if this takes 5 seconds or 5 minutes
3. Static messaging — nothing changes during the wait, feels frozen
4. No explanation of *why* it takes time — users may assume the site is broken

---

## Research Findings

### Key Principles

1. **Perceived time > actual time** — [Research shows](https://blog.logrocket.com/ux-design/skeleton-loading-screen-design/) skeleton screens feel 20% faster than spinners for identical waits. Engaging animations reduce perceived wait by up to 30%.

2. **Active waiting beats passive waiting** — Users perceive time as faster when they're "doing something." Multiple progression phases keep activating user focus.

3. **Set expectations** — Informing users of the purpose of loading makes them tolerate longer waits. Microcopy explaining what's happening reduces frustration.

4. **Show incremental progress** — Progress bars are recommended for operations >10 seconds. Even fake progress is better than no progress.

5. **Left-to-right motion feels faster** — Users perceive screens with left-to-right and slow-steady loading motions as quicker.

### Patterns for Long Waits (10+ seconds)

| Technique | Use Case |
|-----------|----------|
| **Determinate progress bar** | When you can estimate completion % |
| **Multi-step indicators** | When operation has distinct phases |
| **Rotating microcopy** | Keep user engaged with varied messages |
| **Estimated time remaining** | Only if confident in accuracy |
| **Background context** | Tips, facts, or explanations during wait |

---

## Proposed Changes

### Option A: Multi-Phase Progress with Rotating Copy (Recommended)

Show distinct phases that map to the actual backend work:

```
Phase 1 (0-3s):    "Fetching article..."
Phase 2 (3-8s):    "Extracting content..."
Phase 3 (8-15s):   "Running pattern analysis..."
Phase 4 (15-25s):  "AI is reviewing for nuance..."
Phase 5 (25s+):    "Almost there — complex content takes longer..."
```

**Implementation:**
- Track elapsed time with `useState` + `useEffect` interval
- Show a stepped progress bar (4-5 segments)
- Rotate the messaging every few seconds
- Add subtle animation to each phase transition

**Visual concept:**
```
┌────────────────────────────────────────────┐
│                                            │
│            ◉ Extracting content...         │
│                                            │
│   [████████████░░░░░░░░░░░░░░░░]  Step 2/4 │
│                                            │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│   │ ████ │ │ ▓▓▓▓ │ │ ░░░░ │ │ ░░░░ │     │
│   │Fetch │ │Extract│ │Analyze│ │ AI   │     │
│   └──────┘ └──────┘ └──────┘ └──────┘     │
│                                            │
│   💡 We check 5 manipulation signals       │
│      across the full article text          │
│                                            │
└────────────────────────────────────────────┘
```

**Pros:**
- Creates sense of progress even without real progress data
- Explains what's happening (builds trust)
- Each phase transition re-engages attention
- "Almost there" messaging manages expectations for long waits

**Cons:**
- Phases are estimated, not real — could feel fake if way off
- More complex implementation

---

### Option B: Determinate Progress Bar with Time Estimate

Show estimated time remaining based on historical averages:

```
"Analyzing... ~15 seconds remaining"
[████████████░░░░░░░░░░░░░░░░░░░]
```

**Implementation:**
- Track p50 latency by content type (URL vs image, social vs article)
- Show progress bar that fills over estimated duration
- If exceeding estimate, slow the bar and show "Taking longer than usual..."

**Pros:**
- Clear expectation setting
- Familiar pattern (file downloads, installations)

**Cons:**
- Estimates can be wrong — bar stopping at 90% for 20 seconds is worse than no bar
- Need historical data to calibrate

---

### Option C: Contextual Tips During Wait (Supplement)

Add rotating educational content below the progress indicator:

```
💡 Did you know?
"Emotional headlines get 3x more engagement than neutral ones"
```

Rotate every 5 seconds through:
- What each signal means
- How manipulation techniques work
- Tips for spotting outrage bait
- Stats about media manipulation

**Pros:**
- Productive use of wait time
- Builds user knowledge/trust in the tool
- Keeps attention engaged

**Cons:**
- Adds UI complexity
- May feel like filler

---

## Recommendation

**Implement Option A (Multi-Phase Progress) + Option C (Contextual Tips)**

This combination:
1. Sets clear expectations with phase indicators
2. Explains what's happening at each step
3. Re-engages attention with phase transitions
4. Fills long waits with useful context
5. Handles uncertainty gracefully ("Almost there..." for outliers)

### Implementation Priority

1. **Phase 1 (Quick win):** Rotating microcopy only — change the subtitle text every 3-5 seconds
2. **Phase 2:** Add stepped progress indicator (4-5 segments)
3. **Phase 3:** Add contextual tips below progress
4. **Phase 4:** Track actual latency to calibrate phase timing

---

## Metrics to Track

- **Time to first interaction after results** — Are users engaging faster?
- **Bounce rate during loading** — Are fewer users leaving mid-analysis?
- **Perceived speed surveys** — Optional: "How long did that feel?" prompt
- **Abandonment rate** — Already tracked via `ragecheck_analysis_starts`

---

## Open Questions

1. Should we show a "Cancel" button for very long waits?
2. Should we differentiate loading UI for images vs URLs (images are faster)?
3. Do we have enough historical latency data to calibrate phase timing?
