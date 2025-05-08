## Installation and Usage

1. Install dependencies:
```bash
    npm install commander
```
2. Install tsx for executing TypeScript directly:
```bash
    npm install -g tsx
```
3. Run the script:
```bash
    tsx generate-test-vault.ts --count 40000 --output ./test-vault
```

## Script Options

- `--count` or `-c`: Number of notes to generate (default: 40000)
- `--output` or `-o`: Output directory path (default: ./test-vault)
- `--tag-prefix` or `-t`: Status tag prefix (default: obsidian-note-status)
- `--depth` or `-d`: Maximum folder depth (default: 5)
- `--max-per-folder` or `-m`: Maximum files per folder (default: 200)

## Performance Considerations
The script creates a realistic vault structure with:

- Multiple folder levels
- Random distribution of notes across folders
- Variety of statuses including single and multiple status notes
- Varied note content length and structure
- Proper frontmatter format matching your plugin's expectations

This will let you test real-world performance issues with your plugin without needing to manually create thousands of notes.