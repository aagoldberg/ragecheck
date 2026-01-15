# RageCheck Browser Extension

Check if social media content is designed to make you angry - right from your feed.

## Supported Platforms

- Twitter / X
- Bluesky
- Facebook
- Reddit
- Threads

## Installation (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this `extension` folder

## Usage

### Inline Checking
When browsing supported platforms, you'll see a purple "Check" button appear on posts. Click it to get the rage score.

### Popup
Click the extension icon in your toolbar to:
- Analyze any URL manually
- See the current page's rage score (if on a social media site)

## Development

To test against local API:

1. In `content.js`, uncomment the localhost line:
   ```js
   const API_BASE = 'http://localhost:3000';
   ```

2. In `popup/popup.js`, change:
   ```js
   const API_BASE = 'http://localhost:3000';
   ```

3. Reload the extension in `chrome://extensions/`

## Building for Production

1. Replace placeholder icons in `icons/` with proper branded icons
2. Update version in `manifest.json`
3. Zip the extension folder
4. Upload to Chrome Web Store

## Files

- `manifest.json` - Extension configuration
- `content.js` - Injected into social media pages
- `content.css` - Styles for injected buttons
- `popup/` - Extension popup UI
- `icons/` - Extension icons
