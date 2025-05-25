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

### Design Principles

1. **Separation of Concerns**: Clear boundaries between UI, business logic, and data
2. **Service-Based Architecture**: Core functionality in injectable services
3. **Component Modularity**: Reusable UI components with clear interfaces
4. **Event-Driven Communication**: Loose coupling via custom events
5. **Performance-First**: Optimized for large vaults (40k+ notes tested)

## Core Services

### StatusService (`services/status-service.ts`)

**Purpose**: Central hub for all status-related operations
**Key Responsibilities**:

- Status CRUD operations on files
- Template and custom status management
- Frontmatter parsing and manipulation
- Batch operation handling
- Status validation and normalization
  **Design Patterns**:
- **Strategy Pattern**: Different status modification operations (set, add, remove, toggle)
- **Observer Pattern**: Dispatches status change events
- **Template Method**: Standardized status modification workflow

### StyleService (`services/style-service.ts`)

**Purpose**: Dynamic CSS generation and theme management
**Key Responsibilities**:

- Generate CSS rules for custom status colors
- Manage theme compatibility
- Handle dynamic style updates
- CSS injection and cleanup
  **CSS Generation Pattern**:

```css
.status-{statusName} {
  color: {statusColor} !important;
}
```

## Component Architecture

### Component Hierarchy

```
StatusDropdown (DropdownManager)
├── DropdownUI
│   ├── DropdownRender
│   ├── DropdownPosition
│   └── DropdownEvents
├── StatusBar (StatusBarController)
│   └── StatusBarView
├── StatusPane (StatusPaneViewController)
│   └── StatusPaneView
└── ToolbarButton
```

### StatusDropdown System

**Architecture**: Manager → UI → Renderer pattern
**DropdownManager** (`components/status-dropdown/dropdown-manager.ts`):

- High-level dropdown operations
- File and status management
- Event handling coordination
  **DropdownUI** (`components/status-dropdown/dropdown-ui.ts`):
- Core UI component management
- DOM manipulation
- Event listener setup/cleanup
  **DropdownRender** (`components/status-dropdown/dropdown-render.ts`):

- Pure rendering functions
- DOM element creation
- Content population

### StatusBar System

**Architecture**: Controller → View pattern

**StatusBarController**:

- Business logic and state management
- Settings updates and re-rendering
- Integration with status service

**StatusBarView**:

- Pure UI rendering
- DOM manipulation
- No business logic

### StatusPane System

**Architecture**: MVC pattern

**StatusPaneViewController** (Controller):

- Obsidian view lifecycle management
- User interaction handling
- Data fetching and state management

**StatusPaneView** (View):

- Pure rendering functions
- DOM element creation
- No state management

## Integration Architecture

### Obsidian API Integration

#### Workspace Integration (`integrations/workspace/`)

```typescript
class WorkspaceIntegration {
	registerWorkspaceEvents(): void {
		this.app.workspace.on("file-open", this.handleFileOpen);
		this.app.workspace.on(
			"active-leaf-change",
			this.handleActiveLeafChange,
		);
		this.app.workspace.on("layout-change", this.handleLayoutChange);
	}
}
```

**Integration Points**:

- File open events → Status propagation
- Active leaf changes → Toolbar updates
- Layout changes → UI refresh

#### File Explorer Integration (`integrations/explorer/`)

**Challenge**: File explorer uses private Obsidian APIs **Solution**: Defensive programming with fallbacks

```typescript
interface FileExplorerView extends View {
	fileItems: Record<
		string,
		{
			el?: HTMLElement;
			file?: TFile;
			titleEl?: HTMLElement;
			selfEl?: HTMLElement;
		}
	>;
}
```

**Performance Optimizations**:

- Debounced batch updates
- DOM mutation batching
- Memory-efficient icon management

#### Metadata Cache Integration (`integrations/metadata-cache/`)

```typescript
class MetadataIntegration {
	registerMetadataEvents(): void {
		this.app.metadataCache.on("changed", this.handleMetadataChanged);
		this.app.metadataCache.on("resolved", this.handleMetadataResolved);
	}
}
```

**Event Flow**:

1. File frontmatter changes
2. Metadata cache fires 'changed' event
3. Plugin updates UI components
4. Status change event propagated

### Event System

#### Custom Event Architecture

```typescript
// Event dispatch pattern
window.dispatchEvent(new CustomEvent('note-status:status-changed', {
  detail: { statuses: string[], file: string }
}));

// Event listening pattern
window.addEventListener('note-status:status-changed', this.boundHandler);
```

**Event Types**:

- `note-status:status-changed` - Status updates
- `note-status:update-pane` - Pane refresh requests
- `note-status:settings-changed` - Configuration updates

#### Event Flow Diagram

```
User Action → Component → Service → Event Dispatch → UI Updates
     ↓           ↓          ↓            ↓             ↓
Click Status → Dropdown → StatusService → Custom Event → All Components
```

## Data Flow Architecture

### State Management

**Philosophy**: Services as single source of truth, components as views

```
Settings (Plugin) ←→ StatusService ←→ Components
                          ↓
                    File System (Frontmatter)
```

### Status Change Flow

1. **User Interaction** → Component captures intent
2. **Component** → Calls StatusService.handleStatusChange()
3. **StatusService** → Updates file frontmatter
4. **StatusService** → Dispatches status-changed event
5. **All Components** → Update their displays

### Performance Optimization Strategies

#### Large Vault Handling

**Problem**: 40k+ notes can cause UI lag **Solutions**:

- Pagination in status pane (configurable page size)
- Debounced file explorer updates
- Optional exclusion of unknown status files
- Lazy loading of status groups

#### Memory Management

**Strategies**:

- Event listener cleanup on plugin unload
- DOM element cleanup in component destroy methods
- Weak references where applicable
- Batch DOM updates to prevent layout thrashing

#### File System Optimization

**Techniques**:

- Batch frontmatter updates
- Debounced metadata cache operations
- Intelligent file filtering before DOM updates

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

**Development**: CSS files watched and bundled automatically **Production**: Minified and optimized CSS output **Hot Reload**: CSS changes reflected immediately in development

## Plugin Lifecycle

### Initialization Sequence

```typescript
async onload() {
  await this.loadSettings();        // 1. Load saved configuration
  this.initializeServices();        // 2. Create service instances
  this.registerViews();            // 3. Register Obsidian views
  this.initializeUI();             // 4. Create UI components
  this.initializeIntegrations();   // 5. Setup integrations
  this.setupCustomEvents();       // 6. Event system setup
}
```

### Cleanup Sequence

```typescript
onunload() {
  // Event listeners cleanup
  window.removeEventListener('note-status:status-changed', this.boundHandler);

  // Integration cleanup
  this.explorerIntegration?.unload();
  this.workspaceIntegration?.unload();

  // Service cleanup
  this.styleService?.unload();

  // UI cleanup
  this.statusBar?.unload();
  this.statusDropdown?.unload();
}
```

## Error Handling Strategy

### Defensive Programming

```typescript
// File explorer integration with fallbacks
try {
	const fileExplorer = this.findFileExplorerView();
	if (fileExplorer?.fileItems) {
		this.updateIcons(fileExplorer);
	} else {
		this.scheduleRetry();
	}
} catch (error) {
	console.error("Note Status: Explorer integration failed", error);
	this.fallbackToBasicMode();
}
```

### Error Recovery

- Graceful degradation when Obsidian APIs change
- Automatic retry mechanisms for transient failures
- User-visible error messages for critical failures
- Comprehensive logging for debugging

## Extension Points

### Custom Status Templates

```typescript
interface StatusTemplate {
	id: string;
	name: string;
	description: string;
	statuses: Status[];
}
```

### Plugin API (Future)

```typescript
// Planned extension API
interface NoteStatusAPI {
	registerStatusTemplate(template: StatusTemplate): void;
	getFileStatuses(file: TFile): string[];
	setFileStatuses(file: TFile, statuses: string[]): Promise<void>;
}
```

### CSS Customization Points

- Status color overrides
- Component layout modifications
- Animation customization
- Theme integration hooks

## Testing Strategy

### Test Categories

1. **Unit Tests**: Service logic and utilities
2. **Integration Tests**: Obsidian API interactions
3. **Performance Tests**: Large vault scenarios
4. **Manual Tests**: UI interactions and workflows

### Test Utilities

```typescript
// Mock file creation for testing
createMockFile(path: string, frontmatter: any): TFile

// Status service testing helpers
setMockStatuses(file: TFile, statuses: string[]): void
assertStatusEquals(file: TFile, expected: string[]): void
```

## Security Considerations

### Data Validation

- Frontmatter parsing with error handling
- Status name validation (prevent injection)
- File path sanitization

### Permission Model

- Read-only access to Obsidian settings
- Write access only to note frontmatter
- No network requests or external dependencies

### Privacy

- All data stored locally in vault
- No telemetry or external communication
- User content never transmitted
