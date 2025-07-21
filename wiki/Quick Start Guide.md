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
2. Extract the following files into your Obsidian vault under `.obsidian/plugins/note-status/`:
    - `main.js`
    - `manifest.json`
    - `styles.css`
3. In Obsidian, go to **Settings → Community plugins** and enable **Note Status**.

## First Status Assignment

### Using the Toolbar

1. Open any note
2. Click the `❓` icon in the toolbar:
    - ![Status From Toolbar Screenshot](images/status-from-toolbar.png)
3. Select a status (e.g., "active")
4. Status appears in status bar and file explorer:
    - ![Status Bar Screenshot](images/status-bar.png)
    - ![File Explorer Screenshot](images/file-explorer.png)

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
  ![Status Pane Screenshot](images/status-pane.png)

### File Explorer

- Status icons appear next to file names
- Right-click files to change status
- Select multiple files for batch updates - ![Status Pane Screenshot](images/batch-updates.png)
  ![File Explorer Screenshot](images/file-explorer.png)

## Frontmatter Format

The plugin stores statuses in YAML frontmatter:

```yaml
---
obsidian-note-status:
    - active
---
```

Multiple statuses:

```yaml
---
obsidian-note-status:
    - idea
    - HelloWorld
---
```

## Next Steps

- **[[User Manual]]** - Complete feature guide
- **[[Configuration Guide]]** - Custom statuses and templates
- **[[Performance Tuning]]** - Optimize for your vault size

## Quick Reference

| Action            | Method                     |
| ----------------- | -------------------------- |
| Set status        | Click toolbar icon         |
| Batch update      | Select files → right-click |
| View all statuses | Open status pane           |
| Add custom status | Settings → Custom statuses |
| Remove status     | Click status chip → X      |
