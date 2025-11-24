## Settings Reference

All settings are grouped the same way you see them in the plugin. Each section lists what it controls and when to tweak it.

---

## Templates & Statuses

### Status templates

- Enable/disable built-in templates or build your own (name, description, ordered statuses with emoji/Lucide + color).
- Auto-enables new templates; you can reset built-ins anytime.
- Good for shared workflows: research pipelines, task boards, project phases.

### Use only custom statuses

- Hides all template statuses so only your standalone statuses appear.
- Handy for very small personal vocabularies (e.g., `idea`, `draft`, `done`).

### Custom statuses

- Create standalone statuses, reorder, delete.
- Useful for special-purpose tags like `needsReviewByJohn` or `instagramPostReady`.

---

## Quick Actions

### Quick Status Commands

- Registers `Set status to ...` commands you can bind to hotkeys.
- Best when you want fast keyboard-driven changes; shines in single-status mode.

---

## Status Bar

### Visibility and behavior

- Show status icon in status bar; optionally hide when no status is set.
- Show status overview popup on hover for a quick per-key breakdown.
- Show template names next to status: never / auto on conflicts (default) / always.

### Badge visuals

- Badge style: accent stripe / filled / dot.
- Badge content: icon + text / icon only / text only / empty accent.

### No-status display

- Custom text for empty state.
- Show icon when no status.
- Show text when no status.

---

## Editor Toolbar

### Toolbar button

- Show/hide the status button in the editor header.
- Position: left / right-before-actions / right.
- Show for: all notes / active note only.

---

## File Explorer

### Icons and placement

- Show status icons in file explorer.
- Icon position: filename left / filename right / absolute right.
- Hide icon when status is unknown.

### Visual treatments (per-option)

- Color filename text.
- Color entire row.
- Left border.
- Status dot.
- Underline filename.

### Icon styling

- Status icon frame: never / always.
- Status icon color: use status colors / inherit theme colors.

---

## Unknown / No-Status Appearance

### Fallback visuals

- Icon for unknown status (emoji or Lucide).
- Color for unknown status (used across status bar/explorer fallbacks).

---

## Behavior & Storage

### Status model

- Enable multiple statuses (default) or force single-status mode.
- Single-status format when multiple is off: list (`status: [draft]`) or string (`status: draft`).

### Write targets

- Apply status recursively to subfolders (folder context menu option).
- Status tag prefix (frontmatter key, default `obsidian-note-status`).
- Frontmatter mappings: map templates or statuses to additional YAML keys; optional “write mapped tags to default” to keep both in sync.
- Strict status validation: removes unknown statuses on edit (use in controlled vocabularies).

### Safeguards

- Vault size limit: disables dashboard and grouped view beyond the threshold.

---

## Experimental Features

### Toggles

- Enable experimental features (master gate).
- Enable status dashboard.
- Enable grouped status view.
- Dashboard/grouped view respect the vault size limit.
