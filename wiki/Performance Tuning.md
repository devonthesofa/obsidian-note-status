# Performance Tuning

Optimize Note Status for large vaults (tested up to 40k notes).

## Quick Wins

### Essential Settings for 5k+ Notes

```
✅ Exclude unassigned notes from status pane
✅ Hide unknown status in file explorer
Pagination: 50-100 items per page
```

### Disable Heavy Features

```
☐ Show status icons in file explorer (if slow)
☐ Auto-hide status bar (reduces DOM updates)
```

## Minimal Performance Config

```json
{
	"showStatusIconsInExplorer": false,
	"excludeUnknownStatus": true,
	"hideUnknownStatusInExplorer": true,
	"enabledTemplates": ["minimal"]
}
```

## Troubleshooting Lag

### Status Pane Slow

1. Enable compact view
2. Close unused status groups

### File Explorer Sluggish

1. Disable status icons temporarily
2. Restart Obsidian
3. Check for conflicting plugins

### Dropdown Delay

Normal behavior - uses debouncing. If excessive:

- Check console for errors
- Disable strict validation
- Reduce custom statuses count

## Advanced Optimization

### Browser DevTools Analysis

```
1. Ctrl+Shift+I → Performance tab
2. Record while opening status pane
3. Look for:
   - Long tasks > 50ms
   - Excessive DOM operations
   - Memory leaks
```

## Known Limitations

### File Explorer Integration

- Uses private Obsidian APIs
- May break with updates
- Fallback: Disable icons

### Metadata Cache

- Triggers on every frontmatter change
- Batched with 100ms debounce
- Can't be optimized further

### DOM Mutations

- File explorer recreates elements
- Status pane uses virtual scrolling
- Limit: ~10k visible items
