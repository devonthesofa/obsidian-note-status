# Development Setup

Get the plugin running locally for development.

## Prerequisites

- Node.js 16+
- npm or yarn
- Git
- Obsidian installed

## Quick Start

```bash
# Clone and setup
git clone https://github.com/devonthesofa/obsidian-note-status.git
cd obsidian-note-status
npm install

# Development mode (hot reload)
npm run dev

# Build for production
npm run build
```

## Development Workflow

### 1. Link to Test Vault

```bash
# Symlink to your test vault
ln -s /path/to/obsidian-note-status /path/to/vault/.obsidian/plugins/note-status

# Windows
mklink /D "C:\Vault\.obsidian\plugins\note-status" "C:\Dev\obsidian-note-status"
```

### 2. Enable Plugin

1. Open Obsidian
2. Settings → Community plugins → Disable Safe Mode
3. Enable "Note Status"

### 3. Hot Reload

Development mode watches for changes:

- TypeScript changes → Auto rebuild
- CSS changes → Instant update
- Full reload: Ctrl+R in Obsidian

## Common Development Tasks

### Add New Status Template

```typescript
// constants/status-templates.ts
export const PREDEFINED_TEMPLATES: StatusTemplate[] = [
	{
		id: "new-workflow",
		name: "New Workflow",
		description: "Description",
		statuses: [{ name: "status1", icon: "🔥", color: "#FF0000" }],
	},
];
```

### Add New Command

```typescript
// integrations/commands/command-integration.ts
this.plugin.addCommand({
	id: "new-command",
	name: "New Command",
	callback: () => {
		// Implementation
	},
});
```

### Add New Setting

```typescript
// 1. Update interface in models/types.ts
export interface NoteStatusSettings {
	newSetting: boolean;
}

// 2. Add default in constants/defaults.ts
export const DEFAULT_SETTINGS: NoteStatusSettings = {
	newSetting: false,
};

// 3. Add UI in integrations/settings/settings-ui.ts
new Setting(containerEl)
	.setName("New Setting")
	.addToggle((toggle) =>
		toggle
			.setValue(settings.newSetting)
			.onChange((value) =>
				this.callbacks.onSettingChange("newSetting", value),
			),
	);
```

## Build & Release

### Production Build

```bash
npm run build
# Creates: main.js, manifest.json, styles.css
```

### Version Bump

```bash
npm version patch  # or minor/major
# Updates: package.json, manifest.json, versions.json
```

### Release Process

1. Create git tag: `git tag 1.0.13`
2. Push tag: `git push origin 1.0.13`
3. GitHub Actions creates draft release
4. Edit release notes and publish

### Obsidian DevTools

- Ctrl+Shift+I → Console
- Check for plugin errors
- Monitor performance tab

## Code Style

- TypeScript strict mode
- Use `const` by default
- Explicit return types
- Handle null/undefined
- Clean up in unload()

## Contributing

1. Fork repository
2. Create feature branch
3. Follow existing patterns
4. Test with large vault
5. Submit PR with description
