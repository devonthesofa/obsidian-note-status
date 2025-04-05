# Obsidian Note Status Plugin

![Version](https://img.shields.io/badge/version-1.0.8-blue) ![Obsidian](https://img.shields.io/badge/Obsidian-Compatible-green)

The **Note Status** plugin for Obsidian enhances your workflow by allowing you to assign, manage, and visualize statuses for your notes. Whether you're tracking projects, tasks, or personal notes, this plugin provides a seamless way to organize your vault with customizable statuses, a dedicated status pane, and visual indicators.

## Features
- **Status Assignment**: Add statuses (e.g., active, on hold, completed, dropped, unknown) to notes via frontmatter.
- **Status Pane**: A sidebar view to see all notes grouped by status, with search and collapsible sections.
- **Dropdown Menu**: Quickly change a note's status from a dropdown at the top or bottom of the editor.
- **Status Bar**: Displays the current note's status at the bottom of the app, with toggleable visibility.
- **File Explorer Icons**: Shows status icons next to note names in the file explorer for instant recognition.
- **Customization**: Define your own statuses, icons, and colors in the settings, and adjust UI preferences like position and auto-hiding.
- **Commands**: Includes commands to refresh statuses, insert status metadata, and open the status pane.

## Installation
1. **Download the Plugin**:
    - Grab the latest release from the [GitHub Releases page](https://github.com/devonthesofa/obsidian-note-status/releases).
    - Download the files `main.js`, `styles.css` and `manifest.json`
2. **Install in Obsidian**:
    - Open your Obsidian vault and navigate to `.obsidian/plugins/`.
    - Create a folder named `obsidian-note-status` into this directory.
    - Copy the downloaded files in the `obsidian-note-status` folder.
3. **Enable the Plugin**:
    - In Obsidian, go to Settings > Community Plugins.
    - Ensure "Safe Mode" is turned off.
    - Find "Note Status" in the list and toggle it on.

_Note_: This plugin is not yet available in the Obsidian Community Plugin store but will be submitted soon!

## Usage

### Setting a Status

- Open a note and use the command Insert Status Metadata to add a status: unknown field in the frontmatter.
- Change the status manually in the frontmatter, or use the dropdown menu (click the status bar or right-click in the editor and select "Change Note Status").

### Status Pane

- Click the ribbon icon (a bar chart) or use the Open Status Pane command to view all notes grouped by status.
- Use the search bar to filter notes by name.

### Customization

- Go to Settings > Note Status to:
    - Toggle visibility of the dropdown, status bar, and file explorer icons.
    - Adjust positions (top/bottom for dropdown, left/right for status bar).
    - Add, edit, or remove custom statuses with unique icons and colors.

### Example Frontmatter

```yaml
---
status: active
---
```

## Screenshots

![Pasted image 20250403164058](https://github.com/user-attachments/assets/34f91046-c577-4d88-a896-f8b94f93e579)


![Pasted image 20250403164128](https://github.com/user-attachments/assets/0a15a6c6-4630-4605-943b-a7528b4b42de)


- Status Pane: ![Pasted image 20250403164202](https://github.com/user-attachments/assets/1b083773-5e48-49a4-a89e-04de5e78b4a3)

- Dropdown Menu: ![Pasted image 20250403164151](https://github.com/user-attachments/assets/3ffc47e1-e23d-46e9-af62-e7fd431cfcc0)

- File Explorer Icons: ![Pasted image 20250403164222](https://github.com/user-attachments/assets/d029b809-747b-4a21-9da6-4c2a067f5206)


## Development

### Project Structure

The plugin has been recently restructured with a modern, modular architecture:

```
note-status/
├── src/
│   ├── main.ts                 # Main plugin entry point
│   ├── constants/              # Constants and defaults
│   │   ├── icons.ts            # SVG icon definitions
│   │   └── defaults.ts         # Default settings and colors
│   ├── models/                 # TypeScript interfaces and types
│   │   └── types.ts            # Core type definitions
│   ├── ui/                     # UI components
│   │   ├── status-pane-view.ts # Status pane sidebar
│   │   ├── status-dropdown.ts  # Dropdown component
│   │   ├── status-bar.ts       # Status bar component
│   │   ├── explorer.ts         # File explorer integration
│   │   ├── modals.ts           # Modal components
│   │   └── context-menus.ts    # Context menu handlers
│   ├── services/               # Core services
│   │   ├── status-service.ts   # Status management logic
│   │   └── style-service.ts    # Dynamic styling service
│   ├── utils/                  # Utility functions
│   │   ├── dom-utils.ts        # DOM helpers
│   │   └── file-utils.ts       # File-related helpers
│   └── settings/               # Settings UI
│       └── settings-tab.ts     # Settings tab definition
└── styles.css                  # CSS styles
```

### Prerequisites

- Node.js and npm installed.
- Obsidian API knowledge (TypeScript-based).

### Building the Plugin

1. Clone this repository:
```bash
git clone https://github.com/devonthesofa/obsidian-note-status.git
cd obsidian-note-status
```
    
2. Install dependencies:
```bash
npm install
```
    
3. Build the plugin:
```bash
npm run build
```
    
4. The compiled plugin will be in the root directory, ready to copy into .obsidian/plugins/.

### Contributing

- Fork this repository and submit pull requests with improvements or bug fixes.
- Report issues or suggest features via the [Issues tab](https://github.com/devonthesofa/obsidian-note-status/issues).

## Recent Improvements

The v1.0.8 release includes:

- **Complete Code Restructuring**: Modular architecture with proper separation of concerns
- **Enhanced TypeScript Usage**: Improved typing and interfaces for better code reliability
- **Optimized Performance**: More efficient event handling and DOM manipulation
- **Improved Developer Experience**: Better project structure for easier contributions

## Known Issues (Being Addressed)

- **Bug:** When manually editing the status in the frontmatter **after** tags, a weird behavior occurs:
    ```
    status: ...
    ---
    tags:
      - calendar/daily
    ---
    It creates a new block of tags, leaving the old one outside. Needs refinement.
    ```
-  **Improvement:** Further performance optimization for batch status changes

## About the Author

**Aleix Soler** is a professional developer who created this plugin for fun as his first contribution to the Obsidian ecosystem.

- **Website**: [aleixsoler.com](https://aleixsoler.com)
- **GitHub**: [@soler1212](https://github.com/soler1212)
- **Organization**: [@devonthesofa](https://github.com/devonthesofa)

As a daily Obsidian user, Aleix wanted to bring better status management to Obsidian to enhance his own workflow.

If you find this plugin helpful:
- ⭐ Star the repository
- 📣 Share with other Obsidian users

## License

This plugin is released under the MIT License. See the LICENSE file for details.

## Acknowledgments

- Built with assistance from Claude (Anthropic) for code structuring and best practices
- Inspired by the amazing Obsidian community and its plugin ecosystem
