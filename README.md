# BaitCheck

A pattern detector for manipulative outrage framing in media. This is NOT a fact-checker and NOT a political bias judge - it's a tool that flags common outrage-bait patterns to help users think critically about content.

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/baitcheck)

Or deploy via CLI:
```bash
npm i -g vercel
vercel
```

## How It Works

### Scoring Pipeline

BaitCheck uses a **rule-based scoring system** that analyzes text for five categories of outrage-bait patterns:

| Category | Weight | Description |
|----------|--------|-------------|
| Loaded Language | 25% | Emotional, inflammatory words (e.g., "disgusting", "evil", "scum") |
| Absolutist | 15% | Certainty/black-and-white language (e.g., "always", "never", "everyone knows") |
| Threat/Panic | 25% | Fear-mongering framing (e.g., "they're coming for", "under attack", "collapse") |
| Us-vs-Them | 15% | Divisive in-group/out-group language (e.g., "those people", "elites", "real Americans") |
| Engagement Bait | 20% | Clickbait/viral patterns (e.g., "you won't believe", "shocking", "must see") |

### Score Calculation

1. **Pattern Matching**: Scans text for dictionary phrases in each category
2. **Normalization**: Counts are normalized per 1,000 words and capped to prevent extreme scores
3. **Category Scores**: Each category gets a 0-100 score based on pattern density
4. **Weighted Sum**: Final score combines category scores with their weights
5. **Co-occurrence Bonus**: +5-10 points if multiple categories score high simultaneously
6. **Final Score**: Clamped to 0-100

### Score Labels

- **Low (0-33)**: Minimal outrage-bait patterns
- **Medium (34-66)**: Moderate presence of manipulative framing
- **High (67-100)**: Heavy use of outrage-bait techniques

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts    # POST /api/analyze endpoint
│   ├── layout.tsx          # App layout
│   ├── page.tsx            # Main UI
│   └── globals.css         # Styles
└── lib/
    ├── extract.ts          # URL fetching & text extraction
    └── score.ts            # Scoring pipeline & dictionaries
```

## API

### POST /api/analyze

Analyzes a URL for outrage-bait patterns.

**Request:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "success": true,
  "score": 45,
  "label": "Medium",
  "reasons": [
    "Heavy loaded language and emotional appeals (\"outrageous\", \"disgusting\")",
    "Strong us-vs-them divisive framing (\"they\", \"elites\")"
  ],
  "highlights": [
    { "start": 123, "end": 133, "category": "loadedLanguage", "text": "outrageous" }
  ],
  "signalBreakdown": {
    "loadedLanguage": 65,
    "absolutist": 20,
    "threatPanic": 30,
    "usVsThem": 45,
    "engagementBait": 15
  },
  "title": "Article Title",
  "sourceDomain": "example.com",
  "textPreview": "First 500 characters of extracted text..."
}
```

## Adding New Phrases/Weights

### Adding Phrases

Edit `src/lib/score.ts` and add to the `SIGNAL_DICTIONARIES` object:

```typescript
const SIGNAL_DICTIONARIES: Record<SignalCategory, string[]> = {
  loadedLanguage: [
    // Add new phrases here
    "new phrase",
    "another phrase",
    ...existingPhrases
  ],
  // ... other categories
};
```

### Adjusting Weights

Edit the `CATEGORY_WEIGHTS` object in `src/lib/score.ts`:

```typescript
const CATEGORY_WEIGHTS: Record<SignalCategory, number> = {
  loadedLanguage: 25,  // Adjust these values
  absolutist: 15,      // Must sum to 100
  threatPanic: 25,
  usVsThem: 15,
  engagementBait: 20,
};
```

### Adjusting Category Sensitivity

Modify the multipliers in the `signalBreakdown` calculation:

```typescript
const signalBreakdown: SignalBreakdown = {
  loadedLanguage: Math.min(100, normalizedCounts.loadedLanguage * 10),  // Adjust multiplier
  // ...
};
```

## Security Features

- **SSRF Protection**: Blocks private IP ranges and localhost
- **Protocol Restriction**: Only allows HTTP/HTTPS
- **Size Limits**: 5MB max response, 15s timeout
- **Content Type Validation**: Only processes HTML/text content
- **In-Memory Caching**: Prevents repeated fetches of same URL

## Limitations

- Cannot bypass paywalls
- May not extract text from JavaScript-heavy sites
- Pattern matching is keyword-based (not semantic)
- Scores are heuristic, not definitive
- Some legitimate content may score high if discussing outrage topics

## License

MIT
