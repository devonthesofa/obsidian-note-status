# Contributing to Note Status

Use Node.js 24 and the pnpm version declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
```

The pre-commit hook lints and formats staged files. To try a build in Obsidian, copy `main.js`, `manifest.json`, and `styles.css` to `.obsidian/plugins/note-status/` in a test vault. Enable Note Status under Community plugins and exercise the workflow you changed.

## Contribute a template

Create a custom template in Note Status settings and use its share button to copy the JSON. Add the file to the repository's `templates/` directory and open a pull request. Use a unique template ID and include the statuses, colors, and a description of the workflow. See the [template marketplace instructions](README.md#template-marketplace).

## Open a pull request

Describe the behavior you changed and what you tested. Link the relevant issue if there is one. For interface changes, include a screenshot or a short description of what to look for in Obsidian.
