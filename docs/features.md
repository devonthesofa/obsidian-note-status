# Feature Guide

## Status editing & selection

- Open the picker from the status bar badge, editor toolbar button, file explorer context menu, or the `Change current note status` command. The same modal handles single files, multi-select batches, and folder runs.
- Browse by template tabs (All, per template, Custom), search, and use full keyboard navigation (arrows/Tab + Enter/Backspace/Escape). Current statuses appear as removable chips; single-status mode keeps only one value.
- Works on Markdown and non-Markdown; resolves every relevant frontmatter key (default tag and any mappings) before writing.
- Clipboard helpers: `Copy current note status` and `Paste status to current note` mirror what you see in the picker.

## Bulk changes & context menus

- Right-click one or many files → `Change note status` to batch-apply statuses.
- Right-click a folder → `Apply note status to folder`; enable recursion in settings if you want nested folders included.
- The modal shows how many files will change before you confirm.

## Status surfaces

**Status bar**

- Clickable badges; hide entirely or auto-hide when empty. Keep a “No status” badge with custom text/icon/color if you prefer.
- Template names can be hidden, auto-shown only on conflicts, or always shown.
- Badge visuals: accent stripe, solid fill, or dot; content can be icon+text, icon only, text only, or empty accent.

**Editor toolbar**

- Optional badge in the editor header. Place it left, right-before actions, or right, and choose whether it shows for all editors or only the active one.
- Uses the same unknown-status icon/color you configure elsewhere.

**File explorer**

- Status icons appear next to file names. Choose placement (filename left, filename right, absolute right), add a frame or keep it frameless, and pick whether icons use status colors or the theme.
- Extra cues per option: color filename, tint the row, add a left border, append a dot, underline the filename. Unknowns can be hidden.
- Hover an icon to open the Status Overview popup listing every frontmatter key with statuses, highlighting the default tag.

**Status overview popup**

- Lightweight popup used by explorer/status icons; lists statuses per key and labels the default tag. Respects the enable/disable toggle.

## Dashboards and views (experimental)

**Status Dashboard**

- Ribbon icon/command (gated by Experimental Features + Dashboard toggles and the vault size limit). Shows the active note (path, modified time, statuses per tag), vault totals, and a status distribution chart. Clicking a bar runs a search for that status.
- Quick Actions panel: open grouped view, find unassigned notes, change/cycle/clear status, copy/paste status, search by status, toggle multi-status mode, and run Quick Status Commands.

**Grouped Status View**

- Ribbon icon/command (same gating and vault limit). Groups notes by frontmatter key, then by status (template badges shown when relevant).
- Filters: quick search, filter by note name substring, and filter by template id. Groups are collapsible and support “load more” for large sets. Clicking a note opens it in a new leaf.

## Templates & custom statuses

- Built-in templates: Colorful (idea → draft → inProgress → editing → pending → onHold → needsUpdate → completed → archived), Minimal (todo → inProgress → review → done), Academic (research → outline → draft → review → revision → final → published), Project (planning → backlog → ready → inDevelopment → testing → review → approved → live).
- Build your own templates (name, description, ordered statuses with emoji/Lucide + color). New templates auto-enable; you can edit/delete or reset built-ins anytime.
- Custom statuses live outside templates; create, reorder, delete them, or run in “Custom only” mode to hide template statuses entirely.
- Unknown status handling is configurable (icon/Lucide icon, color, and whether unknowns show in explorer/status bar).

## Commands & keyboard shortcuts

- Change current note status (opens picker).
- Cycle through statuses (single-status mode only).
- Clear status.
- Copy/Paste status (clipboard).
- Toggle multiple statuses mode.
- Search notes by current status (opens Global Search with queries for every configured frontmatter key).
- Open grouped status view (requires toggle).
- Quick Status Commands: select statuses in settings to auto-register `Set status to ...` commands you can bind to hotkeys.

## Data & compatibility

- Frontmatter key prefix defaults to `obsidian-note-status`; change it per vault. Map templates/statuses to extra YAML keys, and optionally also write mapped tags to the default key.
- Single-status mode can store the value as a list (`status: [in-progress]`) or plain string (`status: in-progress`) for compatibility with plugins that expect strings.
- Non-Markdown files store statuses in `.obsidian/plugins/obsidian-note-status/non-markdown-statuses.json`. Rename/delete events stay in sync automatically.
- Strict status validation removes unknown statuses when you edit a file’s statuses—use with caution if you expect ad-hoc values.

## Screenshot ideas (add later)

- Status picker modal with template tabs and search.
- File explorer with icons/row coloring and the hover overview popup.
- Status bar badge styles (accent/filled/dot) with and without template names.
- Dashboard and Grouped Status View with filters.
