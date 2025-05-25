# Note Status for Obsidian

[![GitHub release](https://img.shields.io/github/v/release/devonthesofa/obsidian-note-status)](https://github.com/devonthesofa/obsidian-note-status/releases) [![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22note-status%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)](https://obsidian.md/plugins?id=note-status) [![GitHub License](https://img.shields.io/github/license/devonthesofa/obsidian-note-status)](https://github.com/devonthesofa/obsidian-note-status/blob/master/LICENSE)

Track the status of your notes with a powerful, customizable status management system. Mark notes as active, completed, on hold, or create your own custom workflows.

## Features

- **📋 Status Assignment**: Mark notes with workflow statuses
- **🎯 Multi-Status Support**: Assign multiple statuses per note
- **📁 File Explorer Icons**: Visual indicators in the file tree
- **🧭 Status Bar Integration**: View current status at a glance
- **⬇️ Toolbar Dropdown**: Change statuses quickly from the editor
- **📊 Status Pane**: Dedicated view organizing notes by status
- **⚡ Batch Operations**: Update multiple files simultaneously
- **🎨 Custom Statuses**: Define your own statuses
- **🧩 Templates Library**: Use built-in templates
- **🔧 Full Customization**: Control how and where statuses appear
- **🚀 Performance**: Optimized for large vaults (40k+ notes tested)
  ![Hello World Screenshot](images/hello-world.png)

## Quick Start

### Install

1. **Obsidian → Settings → Community plugins**
2. **Search "Note Status" → Install → Enable**

### First Use

1. Open any note
2. Click the `❓` icon in toolbar
3. Select a status (e.g., "active")
4. Status appears in status bar and file explorer

## Example Workflows

### Personal Knowledge Management

```
💡 idea → 📝 draft → ✏️ editing → ✅ completed → 📦 archived
```

### Project Management

```
📋 backlog → 🚦 ready → 👨‍💻 inDevelopment → 🧪 testing → 🚀 live
```

### Academic Research

```
🔍 research → 📑 outline → ✏️ draft → 🔬 review → 📚 final
```

## Documentation

### For Users

- **[[Quick Start Guide|📚 Quick Start Guide]]** - Get running in 5 minutes
- **[[User Manual|📖 User Manual]]** - Complete feature documentation
- **[[Configuration Guide|⚙️ Configuration Guide]]** - Settings and customization
- **[[Performance Tuning|🚀 Performance Tuning]]** - Optimize for large vaults

### For Developers

- **[[Architecture Overview|🏗️ Architecture Overview]]** - Plugin structure and design
- **[[Development Setup|🔧 Development Setup]]** - Contributing guide

### Reference

- **[[Frontmatter Format|📝 Frontmatter Format]]** - Technical specification

## Data Format

Statuses are stored in note frontmatter:

```yaml
---
obsidian-note-status:
    - HelloWorld
    - draft
---
# Your note content
```

## Contributing

Contributions welcome! See [Development Setup](../../wiki/Development-Setup) for details.

## Support the Development

If you find this plugin useful and would like to support its development, you can make a donation through my PayPal account. Any contribution is greatly appreciated and helps me continue improving the plugin!

PayPal: https://paypal.me/aleixsoler
