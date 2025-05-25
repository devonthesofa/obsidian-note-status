Technical documentation for developers working with the Note Status plugin.

## High-Level Architecture

### Plugin Structure

```
note-status/
├── main.ts                     # Plugin entry point and orchestration
├── constants/                  # Static configuration and defaults
├── models/                     # TypeScript interfaces and types
├── services/                   # Core business logic services
├── components/                 # Reusable UI components
├── integrations/               # External system integrations
├── views/                      # Complex UI views and controllers
└── styles/                     # Modular CSS architecture
```

## Core Services

### Status Change Flow

1. **User Interaction** → Component captures intent
2. **Component** → Calls StatusService.handleStatusChange()
3. **StatusService** → Updates file frontmatter
4. **StatusService** → Dispatches status-changed event
5. **All Components** → Update their displays

## CSS Architecture

### Modular CSS Structure

```
styles/
├── index.css              # Main import file
├── base.css               # Variables and base styles
├── utils.css              # Utility classes
└── components/            # Component-specific styles
    ├── status-bar.css
    ├── status-pane.css
    ├── dropdown.css
    ├── explorer.css
    └── settings.css
```

### CSS Variable System

```css
:root {
	--status-transition-time: 0.22s;
	--status-border-radius: var(--radius-s, 4px);
	--status-box-shadow: var(--shadow-s, 0 2px 8px rgba(0, 0, 0, 0.15));
	--status-hover-shadow: var(--shadow-m, 0 4px 12px rgba(0, 0, 0, 0.2));
	--status-icon-size: 16px;
}
```

### Build Process

**Development**: CSS files watched and bundled automatically
**Production**: Minified and optimized CSS output
**Hot Reload**: CSS changes reflected immediately in development

## Security Considerations

### Data Validation

- Frontmatter parsing with error handling
- Status name validation (prevent injection)
- File path sanitization

### Privacy

- All data stored locally in vault
- No telemetry or external communication
- User content never transmitted
