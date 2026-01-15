# Extension Icons

Replace these placeholder icons with actual PNGs:

- `icon16.png` - 16x16px (toolbar)
- `icon48.png` - 48x48px (extension management)
- `icon128.png` - 128x128px (Chrome Web Store)

You can use the RageCheck logo or create a simple fire/thermometer icon.

## Quick placeholder generation

You can generate simple placeholders with ImageMagick:

```bash
convert -size 16x16 xc:'#6366f1' icon16.png
convert -size 48x48 xc:'#6366f1' icon48.png
convert -size 128x128 xc:'#6366f1' icon128.png
```

Or use an online tool like https://favicon.io to generate from text/emoji.
