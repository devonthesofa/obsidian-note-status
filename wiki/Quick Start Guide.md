# Quick Start Guide

Get the Note Status plugin working in under 5 minutes.

## Installation

### Method 1: Community Plugin Store (Recommended)

1. Open Obsidian → Settings → Community plugins
2. Disable Safe mode
3. Click "Browse" → Search "Note Status"
4. Install and Enable

### Method 2: Manual Installation

1. Download latest release from [GitHub](https://github.com/devonthesofa/obsidian-note-status/releases)
2. Extract to `.obsidian/plugins/note-status/`
3. Enable in Community plugins

## First Status Assignment

### Using the Toolbar

1. Open any note
2. Click the `❓` icon in the toolbar
3. Select a status (e.g., "active")
4. Status appears in status bar and file explorer

### Using Commands

1. Press `Ctrl/Cmd + P` for command palette
2. Type "Change status"
3. Select status from dropdown

## Essential Settings

Access via Settings → Note Status:

```
✅ Show status bar
✅ Show status icons in file explorer
✅ Enable multiple statuses
❌ Auto-hide status bar (disable for learning)
```

## Status Templates

Enable a template for instant statuses:

**Recommended for beginners: "Minimal workflow"**

- `todo` 📌
- `inProgress` ⚙️
- `review` 👀
- `done` ✓

## First Workflow

1. **Create a project note** → Set status to `todo`
2. **Start working** → Change to `inProgress`
3. **Need feedback** → Change to `review`
4. **Complete** → Change to `done`

## Viewing Your Statuses

### Status Pane (Recommended)

- Click status icon in left sidebar
- See all notes grouped by status
- Click any note to open

### File Explorer

- Status icons appear next to file names
- Right-click files to change status
- Select multiple files for batch updates

## Performance Setup (Large Vaults)

If you have 1000+ notes:

```
✅ Exclude unassigned notes from status pane
✅ Hide unknown status in file explorer
```

## Frontmatter Format

The plugin stores statuses in YAML frontmatter:

```yaml
---
obsidian-note-status: ["active"]
---
```

Multiple statuses:

```yaml
---
obsidian-note-status: ["active", "inProgress"]
---
```

## Next Steps

- **[User Manual](https://claude.ai/chat/User-Manual)** - Complete feature guide
- **[Configuration Guide](https://claude.ai/chat/Configuration-Guide)** - Custom statuses and templates
- **[Performance Tuning](https://claude.ai/chat/Performance-Tuning)** - Optimize for your vault size

## Common First-Time Issues

### Status not showing

- Check that Community plugins are enabled
- Verify the file has `.md` extension
- Look for frontmatter in source mode

### Performance slow

- Enable "Exclude unassigned notes" in settings
- Disable file explorer icons temporarily

### Can't find dropdown

- Look for `❓` icon in toolbar (right side)
- Try right-clicking in file explorer
- Use Command Palette: "Change status"

## Quick Reference

| Action            | Method                     |
| ----------------- | -------------------------- |
| Set status        | Click toolbar icon         |
| Batch update      | Select files → right-click |
| View all statuses | Open status pane           |
| Add custom status | Settings → Custom statuses |
| Remove status     | Click status chip → X      |
