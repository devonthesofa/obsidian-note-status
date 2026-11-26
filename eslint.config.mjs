import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
	globalIgnores([
		"main.js",
		"esbuild.config.mjs",
		"eslint.config.mjs",
		"version-bump.mjs",
	]),
	...obsidianmd.configs.recommended,
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			parserOptions: { projectService: true },
		},
		rules: {
			"@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
			"@typescript-eslint/no-empty-function": "off",
			// Keep the existing TypeScript policy while adding the Scorecard checks.
			"@typescript-eslint/no-base-to-string": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			// Settings definitions were introduced after the supported minimum.
			"obsidianmd/settings-tab/prefer-setting-definitions": "off",
		},
	},
]);
