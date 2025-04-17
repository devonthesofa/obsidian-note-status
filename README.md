# Note Status for Obsidian

> Enhance your note organization with a powerful status management system for Obsidian

![GitHub release](https://img.shields.io/github/v/release/devonthesofa/obsidian-note-status)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22note-status%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)
![GitHub License](https://img.shields.io/github/license/devonthesofa/obsidian-note-status)

## Overview

The Note Status plugin allows you to assign and track statuses for your notes in Obsidian. Easily visualize where each note stands in your workflow using customizable statuses like active, on hold, completed, or dropped – or create your own personalized status system.

<img src="https://raw.githubusercontent.com/devonthesofa/obsidian-note-status/main/resources/status-ui-preview.png" alt="Note Status UI Preview" width="800"/>

## Features

- **Assign Statuses to Notes**: Mark your notes with statuses to track their progress
- **File Explorer Integration**: See status icons directly in your file explorer
- **Status Bar & Dropdown**: Quick access to change status from the editor
- **Status Pane**: Dedicated view that organizes your notes by status
- **Batch Update**: Apply statuses to multiple files at once
- **Multiple Status Support**: Optionally apply multiple statuses to a single note
- **Template Support**: Choose from predefined status templates or create your own
- **Customizable**:
  - Create custom statuses with icons and colors
  - Set display preferences for UI elements
  - Configure where and how status information appears

## Installation

Install directly from Obsidian:
1. Open Settings → Community plugins
2. Disable Safe mode
3. Click "Browse" and search for "Note Status"
4. Click Install
5. Enable the plugin

## Usage

### Basic Usage

1. Open any markdown note
2. Click on the status icon in the toolbar or use the status bar at the bottom
3. Select a status from the dropdown
4. The status is saved in your note's frontmatter

### Status Pane

Open the Status Pane via:
- Ribbon icon (left sidebar)
- Command palette: "Note Status: Open Status Pane"

The Status Pane groups your notes by status for easy management and overview.

### Batch Updates

To update multiple files at once:
1. Select files in the file explorer
2. Right-click and choose "Change Status"
3. Or use the "Batch Update Status" command from the command palette

### Commands

- `Note Status: Open Status Pane` - Opens the status pane view
- `Note Status: Refresh Status` - Refreshes the current note's status
- `Note Status: Batch Update Status` - Opens the batch update modal
- `Note Status: Insert Status Metadata` - Inserts status metadata in the current note
- `Note Status: Toggle Status Dropdown` - Shows/hides the status dropdown
- `Note Status: Force Refresh UI` - Forces a complete UI refresh

## Configuration

Visit the plugin settings to customize:

- Default statuses and colors
- Enable/disable UI elements
- Choose status templates
- Create and manage custom statuses
- Configure display preferences

## Templates

The plugin includes several status templates:

- **Colorful Workflow**: A colorful set of workflow statuses with descriptive icons
- **Minimal Workflow**: A simplified set of essential workflow statuses
- **Academic Research**: Status workflow for academic research and writing
- **Project Management**: Status workflow for project management and tracking

## Advanced Usage

### Status Metadata Format

Statuses are stored in your note's frontmatter using the following format:

```yaml
---
obsidian-note-status: ["active"]
---
```

For multiple statuses:

```yaml
---
obsidian-note-status: ["active", "inProgress"]
---
```

### Custom Hotkeys

Set up custom hotkeys for frequently used statuses in Obsidian's Hotkeys settings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## Development

To build the plugin:

```bash
npm install
npm run build
```

For development:

```bash
npm run dev
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.