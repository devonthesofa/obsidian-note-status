# Frontmatter Format

Technical specification for Note Status metadata storage.

## Format Overview

Status metadata is stored in YAML frontmatter using a configurable tag prefix.

```yaml
---
obsidian-note-status:
    - active
---
```

## Specification

### Field Name

- **Default**: `obsidian-note-status`
- **Type**: String or Array
- **Configurable**: Yes, via `tagPrefix` setting

### Value Types

#### Single Status (Array)

```yaml
---
obsidian-note-status:
    - active
---
```

#### Multiple Statuses (Array)

```yaml
---
obsidian-note-status:
    - active
    - hello
    - world
---
```

## Valid Status Values

### Default Statuses

- `unknown` - No status assigned
- Template Statuses: Any status defined in enabled templates
    - Must match exact name (case-sensitive)
    - Icon and color stored separately
- Custom Statuses: User-defined statuses
    - Any string value allowed
    - No spaces
    - Case-sensitive matching

## Validation

With `strictStatuses: true`:

- Only defined statuses allowed
- Unknown statuses removed on save
- Case-sensitive matching

## Custom Tag Prefix

### Configuration

```javascript
settings.tagPrefix = "project-status";
```

### Result

```yaml
---
project-status:
    - inDevelopment
    - testing
---
```

## Integration Examples

### Dataview Query

```dataview
TABLE obsidian-note-status as Status
FROM ""
WHERE contains(obsidian-note-status, "active")
```

### Templater

```yaml
---
obsidian-note-status: ["<% tp.system.prompt("Status?") %>"]
---
```

### QuickAdd

```yaml
---
obsidian-note-status: ["{{VALUE:active,onHold,completed}}"]
---
```

### Reserved Values

- `unknown` - System reserved
- Empty string - Converted to unknown
- `null`/`undefined` - Treated as unknown
