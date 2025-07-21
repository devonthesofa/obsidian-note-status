# Configuration Guide

Complete guide to customizing the Note Status plugin.

## Settings Overview

Access via Settings → Note Status

### Status Templates

Controls which predefined status sets are available.

#### Template Selection

```
☐ Colorful workflow (9 statuses with full lifecycle)
☐ Minimal workflow (4 essential statuses)
☐ Academic research (7 research-focused statuses)
☐ Project management (8 development statuses)
```

**Impact**: Enabled templates add their statuses to dropdown.

#### Template Details

**Colorful Workflow** - Complete content lifecycle:

```
💡 idea (#FFEB3B)        - Initial concepts and brainstorming
📝 draft (#E0E0E0)       - First draft creation
🔧 inProgress (#FFC107)  - Active development work
🖊️ editing (#2196F3)     - Review and editing phase
⏳ pending (#9C27B0)     - Waiting for external input
⏸ onHold (#9E9E9E)       - Temporarily paused
🔄 needsUpdate (#FF5722) - Requires updates/revision
✅ completed (#4CAF50)   - Finished and ready
📦 archived (#795548)    - Long-term storage
```

**Minimal Workflow** - Essential only:

```
📌 todo (#F44336)        - Needs attention
⚙️ inProgress (#2196F3)   - Currently working
👀 review (#9C27B0)      - Needs review
✓ done (#4CAF50)         - Completed
```

**Academic Research** - Research-focused:

```
🔍 research (#2196F3)    - Information gathering
📑 outline (#9E9E9E)     - Structure planning
✏️ draft (#FFC107)        - Writing phase
🔬 review (#9C27B0)      - Peer review stage
📝 revision (#FF5722)    - Revisions needed
📚 final (#4CAF50)       - Final version
🎓 published (#795548)   - Published work
```

**Project Management** - Development workflow:

```
🗓️ planning (#9E9E9E)      - Planning phase
📋 backlog (#E0E0E0)       - Backlog items
🚦 ready (#8BC34A)         - Ready to start
👨‍💻 inDevelopment (#2196F3) - Development phase
🧪 testing (#9C27B0)       - Testing phase
👁️ review (#FFC107)        - Code review
👍 approved (#4CAF50)      - Approved
🚀 live (#3F51B5)          - Production/live
```

![File Explorer Screenshot](images/status-templates.png)

### User Interface Settings

#### Status Bar Configuration

```
✅ Show status bar
   Shows "Status: active" at bottom of editor

☐ Auto-hide status bar
   Hides when status is "unknown"
   Useful for clean interface when no status assigned

Custom Unknown Status:
   ✅ Show custom icon for unknown status
   📝 Custom unknown icon: [❓]
   Customize the icon displayed for notes without status
```

#### File Explorer Integration

```
✅ Show status icons in file explorer
   Displays status icons next to filenames

☐ Hide unknown status in file explorer
   Improves visual clarity by hiding ❓ icons
   Recommended for large vaults

Icon Position: [Before name | After name]
   Configure where status icons appear in the file tree
   Before name: Shows status before filename
   After name: Shows status after filename (default)
```

### Status Behavior

#### Multiple Status Support

```
✅ Enable multiple statuses
   Allows notes to have multiple simultaneous statuses
   Changes dropdown behavior from replace to toggle
```

**When Enabled**:

- Clicking status toggles it on/off
- Notes can have combinations like ("active", "inProgress",....)
- Status bar shows all assigned statuses
  **When Disabled**:
- Clicking status replaces current status
- Notes have single status only
- Simpler workflow for basic usage

#### Status Tag Configuration

```
Status tag prefix: "obsidian-note-status"
```

**Purpose**: YAML frontmatter key for storing statuses **Default**: `obsidian-note-status` **Custom example**: `project-status`, `task-state`

**Frontmatter examples**:

```yaml
# Default
---
obsidian-note-status:
    - active
---
# Custom prefix
---
project-status:
    - inProgress
    - testing
---
```

#### Strict Status Validation

```
☐ Strict status validation
   Only allows statuses defined in templates/custom
   ⚠️ WARNING: Removes unknown statuses when editing
```

**Impact when enabled**:

- Dropdown only shows defined statuses
- Unknown statuses automatically removed during edits
- Ensures consistency but may lose data

**Use cases**:

- Team environments with standardized workflows
- Clean data requirements
- Migration from other systems

### Custom Status Management

#### Creating Custom Statuses

1. **Navigate to Custom Statuses section**
2. **Click "Add Status"**
3. **Configure fields**:

```
Name: [unique identifier]
Icon: [emoji or symbol]
Color: [CSS color value]
Description: [optional tooltip text]
```

#### Field Specifications

**Name Field**:

- Must be unique across all statuses
- Case-sensitive
- No spaces
- Used in frontmatter and commands

**Icon Field**:

- Emoji recommended: 🔥, ⭐, 🎯
- Unicode symbols: ◆, ▲, ●
- Text symbols: !, ?, +
- Fallback: ❓ if empty

**Color Field**:

- Hex format: `#FF5722`
- CSS variables: `var(--text-success)`
- Named colors: `red`, `blue`
- RGB/HSL: `rgb(255, 87, 34)`

**Description Field**:

- Optional tooltip text
- Shows on hover in dropdowns
- Useful for team workflows
- Example: "Waiting for client feedback"

#### Custom Status Examples

**Personal Workflow**:

```
urgent     🔥 #FF0000 "Requires immediate attention"
someday    💭 #9E9E9E "Future consideration"
waiting    ⏰ #FFC107 "Waiting for external input"
delegated  👥 #2196F3 "Assigned to someone else"
```

**Content Creation**:

```
brainstorm 💡 #FFEB3B "Initial idea development"
research   🔍 #9C27B0 "Gathering information"
outline    📋 #E0E0E0 "Structuring content"
writing    ✍️ #2196F3 "Active writing phase"
editing    ✏️ #FF9800 "Revision and editing"
published  🌟 #4CAF50 "Live and published"
```

#### Custom-Only Mode

```
☐ Use only custom statuses
   Ignores all template statuses
   Uses only custom-defined statuses
```

**Use cases**:

- Highly specialized workflows
- Team standardization
- Legacy system migration

### Quick Status Commands

Configure which statuses get dedicated commands in Command Palette.

#### Command Generation

For each enabled status, creates:

- `Set status to [status]` - Direct assignment
- `Toggle status [status]` - Toggle on/off (if multiple statuses enabled)

#### Recommended Quick Commands

```
✅ active      - Most common work status
✅ completed   - Frequently used completion
✅ onHold      - Common pause state
☐ todo         - Redundant with "active"
☐ archived     - Infrequent use
```

#### Hotkey Assignment

1. **Settings → Hotkeys**
2. **Search "note-status"**
3. **Assign keys to quick commands**

**Suggested hotkeys**:

```
Ctrl+Shift+A  →  Set status to active
Ctrl+Shift+D  →  Set status to completed
Ctrl+Shift+H  →  Set status to onHold
Ctrl+Shift+S  →  Change status of current note
```

## Advanced Configuration

### Performance Tuning

#### Memory Optimization

```
☐ Show status icons in file explorer (disable if slow)
☐ Auto-hide status bar (reduce DOM updates)
```

### Template-Based Status Scoping

#### Overview

```
✅ Enable template-based filtering
   Scope statuses to specific note templates
   Organize status groups by note type
```

#### Template Configuration

1. **Define note templates** in your vault
2. **Associate statuses with templates** in settings
3. **Filter status pane** by template type

**Example workflow**:

```
Daily Notes Template → [active, completed, onHold]
Project Template → [planning, inProgress, testing, live]
Meeting Template → [scheduled, completed, followUp]
```

#### Status Pane Filtering

- **Template dropdown** filters notes by template type
- **Combined filtering** works with status and search filters
- **Grouped view** organizes by template and status

### Import/Export Configuration

_This feature is planned for future releases._
