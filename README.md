# Note Status for Obsidian

[![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/aleixsoler)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/aleixsoler)

[![GitHub release](https://img.shields.io/github/v/release/devonthesofa/obsidian-note-status)](https://github.com/devonthesofa/obsidian-note-status/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/devonthesofa/obsidian-note-status/release.yml)](https://github.com/devonthesofa/obsidian-note-status/actions)
[![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22note-status%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)](https://obsidian.md/plugins?id=note-status)
[![GitHub License](https://img.shields.io/github/license/devonthesofa/obsidian-note-status)](https://github.com/devonthesofa/obsidian-note-status/blob/master/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/devonthesofa/obsidian-note-status)](https://github.com/devonthesofa/obsidian-note-status/stargazers)

Track the lifecycle of every file in your vault using statuses you fully control. Note Status brings visual clarity and structured workflows to Obsidian—whether you're managing research notes, writing projects, tasks, or long-term archives.

It works on both Markdown and non-Markdown files, integrates into multiple UI surfaces, and provides configurable dashboards, commands, and fast actions to keep information flowing.

## Contents

- [Feature Guide](docs/features.md): what the plugin can do across commands, UI surfaces, and workflows.
- [Settings Reference](docs/settings.md): every option, grouped like the in-app settings.

![Big picture 1](images/big-picture-1.png)
![Big picture 1](images/big-picture-2.png)

## Quick start

1. Open Settings → Note Status.
2. Expand **Templates & Statuses** and keep a built-in template or add your own/custom-only set.
3. Pick where to see/change status: **Status Bar** or **Editor Toolbar**.
4. Set a status from the badge or run `Change current note status`.
5. Watch file explorer icons update; hover for the overview popup or click to change again.
6. If enabled, open the **Status Dashboard** or **Grouped Status View** from the ribbon/commands.

## Key features

- Status picker everywhere: status bar badge, editor toolbar, explorer context menus, commands.
- Multi-status or single-status workflows; quick-status commands for hotkeys.
- File explorer icons with configurable placement, frames, and visual treatments (row tint, underline, dot, border).
- Status bar badges with accent/filled/dot styles and icon/text options; template names can auto-show on conflicts.
- Dashboards and grouped views (gated by experimental toggles and vault size limit) for vault-wide visibility and quick actions.
- Built-in templates (Colorful, Minimal, Academic, Project) plus full custom templates and standalone custom statuses.
- Works with YAML frontmatter and non-Markdown via a synced JSON store; frontmatter mappings let you write to multiple keys.

## Data model

- **Markdown**: statuses live under the tag prefix (default `obsidian-note-status`). Map templates/statuses to extra YAML keys and optionally also write to the default.
- **Non-Markdown**: stored in `.obsidian/plugins/obsidian-note-status/non-markdown-statuses.json`, kept in sync on rename/delete.
- **Single vs multi**: multiple statuses by default; single-status mode can store as list (`status: [draft]`) or string (`status: draft`) for compatibility.

## Screenshots

- Nav bar with current status

    - ![navbar-unnasigned](images/navbar-unnasigned.png)
    - ![navbar-multiple](images/navbar-multiple.png)

- Status assignment:

    - ![change-not-status-modal](images/change-not-status-modal.png)

- File explorer with status icons and hover overview:
    - ![file-explorer-and-popup](images/file-explorer-and-popup.png)
- Multiple settings:
    - ![settings-collapsed](images/settings-collapsed.png)
- Custom templates editor:
    - ![settings-collapsed](images/status-templates-1.png)
    - ![settings-collapsed](images/custom-templates.png)
- Frontmatter tags mapping
    - ![frontmatter-mappings](images/frontmatter-mappings.png)
- Grouped status view:
    - ![status-groups-full-picture-2](images/status-groups-full-picture-2.png)
- Status dashboard:
    - ![status-dashboard-1](images/status-dashboard-1.png)
    - ![status-dashboard-2](images/status-dashboard-2.png)
    - ![status-dashboard-3](images/status-dashboard-3.png)

## Installation

### Community Plugin Store (recommended)

1. Obsidian → Settings → Community plugins.
2. Disable Safe mode → Browse → search “Note Status”.
3. Install and enable.

### Manual

1. Download the latest release from [GitHub Releases](https://github.com/devonthesofa/obsidian-note-status/releases).
2. Extract `main.js`, `manifest.json`, and `styles.css` to `.obsidian/plugins/note-status/`.
3. Enable in Community plugins settings.

## Example workflows

**Personal knowledge**

```
💡 idea → 📝 draft → ✏️ editing → ✅ completed → 📦 archived
```

**Project delivery**

```
📋 backlog → 🚦 ready → 👨‍💻 inDevelopment → 🧪 testing → 🚀 live
```

**Academic**

```
🔍 research → 📑 outline → ✏️ draft → 🔬 review → 📚 final
```

## Data format

Statuses in YAML(as string or array, it depends of your settings):

```yaml
---
obsidian-note-status:
    - active
    - inProgress
---
```

Works with Dataview, Templater, QuickAdd, and search. Non-Markdown uses the JSON store noted above.

## Support the project

[![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/aleixsoler)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/aleixsoler)

---

**License**: MIT · **Author**: [Aleix Soler](https://aleixsoler.com)
