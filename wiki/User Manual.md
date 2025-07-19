# User Manual

Complete guide to all Note Status plugin features.

## Core Concepts

### Status System

- **Status**: A label applied to notes (active, completed, etc.)
- **Multiple Statuses**: Notes can have multiple statuses simultaneously
- **Unknown Status**: Default for notes without assigned status
- **Templates**: Predefined sets of statuses for different workflows

### Storage Format

Statuses are stored in YAML frontmatter:

```yaml
---
obsidian-note-status:
    - idea
    - HelloWorld
---
```

## Interface Components

### 1. Toolbar Button

**Location**: Editor toolbar (rightmost icon) **Appearance**: Shows current status icon or `❓` for unknown **Function**: Click to open status dropdown

**Visual Indicators**:

- Single status: Shows status icon
- Multiple statuses: Shows primary status + count badge
- Unknown status: Shows `❓` icon

### 2. Status Bar

**Location**: Bottom of editor **Display**: `Status: active` or `Statuses: active, inProgress` **Behavior**:

- Click to open dropdown
- Auto-hide when status is unknown (configurable)

### 3. Status Dropdown

**Trigger**: Click toolbar button, status bar, or context menu **Features**:

- Current status chips (removable)
- Search/filter statuses
- Status options with icons
- Multi-file support

### 4. File Explorer Integration

**Visual**: Status icons next to file names
**Interaction**: Right-click for context menu
**Multi-select**: Select multiple files for batch operations

### 5. Status Pane

**Location**: Left sidebar
**Access**: Ribbon icon or Command Palette
**Features**:

- Notes grouped by status
- Search functionality
- Compact/standard view toggle
- Pagination for large groups

## Basic Operations

### Setting Status (Single Note)

#### Method 1: Toolbar

1. Open note
2. Click toolbar status icon
3. Select status from dropdown

#### Method 2: Right-click

1. Right-click note in file explorer
2. Select "Change status"
3. Choose status

#### Method 3: Command Palette

1. `Ctrl/Cmd + P`
2. Type "Change status"
3. Select status

### Multiple Statuses

When enabled in settings:

**Add Status**:

- Click non-selected status in dropdown
- Status is added to existing ones

**Remove Status**:

- Click X on status chip
- Status is removed

**Toggle Mode**:

- Each click toggles status on/off
- Useful for quick status management

### Batch Operations

**Select Multiple Files**:

- `Ctrl/Cmd + Click` for individual selection
- `Shift + Click` for range selection

**Apply Status**:

1. Right-click selection
2. Choose "Change status"
3. Select status
4. Chooses add/remove based on majority

**Batch Logic**:

- If >50% of files have status → Remove
- If <50% of files have status → Add
- Smart handling preserves other statuses

## Advanced Features

### Status Pane Operations

#### Views

- **Standard**: Full file icons and spacing
- **Compact**: Dense list format

#### Search

- Filters notes by filename
- Real-time filtering
- Case-insensitive

#### Pagination

- Configurable items per page (default: 100)
- Prevents performance issues
- Per-status pagination state

#### Group Management

- Click group header to collapse/expand
- State persisted between sessions
- Shows file count per status

### Context Menus

#### Single File

- **File Explorer**: Right-click → "Change status"
- **Editor**: Right-click → "Change note status"

#### Multiple Files

- **Batch Selection**: Right-click → "Change status"
- **Status Management**: Dedicated multi-file interface

### Commands

All commands available via Command Palette:

#### Core Commands

- `Open status pane` - Show status sidebar
- `Change status of current note` - Open dropdown
- `Add status to current note` - Add mode dropdown
- `Cycle to next status` - Rotate through statuses
- `Clear status` - Set to unknown

#### Quick Commands (Configurable)

- `Set status to [status]` - Direct status assignment
- `Toggle status [status]` - Toggle specific status

#### Utility Commands

- `Copy status from current note` - Copy to clipboard
- `Paste status to current note` - Apply from clipboard
- `Toggle multiple statuses mode` - Enable/disable multi-status
- `Search notes by current status` - Global search

## Global Search Integration

Use Obsidian's global search with status queries:

```
[obsidian-note-status:"active"]
[obsidian-note-status:"inProgress" OR "review"]
```

## Keyboard Shortcuts

### Default Shortcuts

None assigned by default - customize in Obsidian settings.

### Recommended Shortcuts

- `Ctrl/Cmd + Shift + S` - Change status
- `Ctrl/Cmd + Shift + P` - Open status pane
- `Ctrl/Cmd + Shift + A` - Set status to active
- `Ctrl/Cmd + Shift + D` - Set status to done

### Quick Status Commands

Configure in settings to enable hotkeys for frequently used statuses.
