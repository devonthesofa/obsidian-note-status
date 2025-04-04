# Obsidian Note Status Plugin

![Version](https://img.shields.io/badge/version-1.0.2-blue) ![Obsidian](https://img.shields.io/badge/Obsidian-Compatible-green)

The **Note Status** plugin for Obsidian enhances your workflow by allowing you to assign, manage, and visualize statuses for your notes. Whether you're tracking projects, tasks, or personal notes, this plugin provides a seamless way to organize your vault with customizable statuses, a dedicated status pane, and visual indicators.
## Features
- **Status Assignment**: Add statuses (e.g., active, on hold, completed, dropped, unknown) to notes via frontmatter.
- **Status Pane**: A sidebar view to see all notes grouped by status, with search and collapsible sections.
- **Dropdown Menu**: Quickly change a note’s status from a dropdown at the top or bottom of the editor.
- **Status Bar**: Displays the current note’s status at the bottom of the app, with toggleable visibility.
- **File Explorer Icons**: Shows status icons next to note names in the file explorer for instant recognition.
- **Customization**: Define your own statuses, icons, and colors in the settings, and adjust UI preferences like position and auto-hiding.
- **Commands**: Includes commands to refresh statuses, insert status metadata, and open the status pane.
## Installation
1. **Download the Plugin**:
    - Grab the latest release (v1.0.2) from the [GitHub Releases page](https://github.com/devonthesofa/obsidian-note-status/releases).
    - Extract the zip file to get the plugin folder (obsidian-note-status).
2. **Install in Obsidian**:
    - Open your Obsidian vault and navigate to .obsidian/plugins/.
    - Copy the obsidian-note-status folder into this directory.
    - If the plugins folder doesn’t exist, create it.
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
## Known Limitations
- Dropdown positioning uses DOM-based workarounds due to limited API support for editor coordinates.
- Initial release; some edge cases may still need refinement—please report bugs!
## License
This plugin is released under the . Feel free to use, modify, and distribute it as you see fit.
## Acknowledgments
- Built with help from [xAI’s Grok](https://xai.com) for code assistance and debugging.
- Inspired by the amazing Obsidian community and its plugin ecosystem.
