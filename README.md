# The Brain

A self-contained second brain for your notes and public GitHub repositories.

## The only application file

`index.html` contains all the HTML, CSS, and JavaScript. Copy the entire file into your own `index.html`. There are no packages to install, build steps, API keys, or backend services.

## Run it manually

1. Save `index.html` in a folder.
2. Open a terminal in that folder.
3. If Python is installed, run:

   ```powershell
   python -m http.server 4173 --bind 127.0.0.1
   ```

4. Open **http://127.0.0.1:4173/** in a modern browser.
5. Click **GitHub**, leave the username as **arnaut560000**, and choose **Import / refresh**.

You can also open the HTML directly, but a local server gives browser storage a consistent address. Always use the same browser and address to access saved notes. To stop the server, press Ctrl+C in its terminal.

## Features

- Dark interactive graph: drag nodes, pan the background, zoom, and fit the graph.
- Markdown notes with headings, bullet lists, bold text, code blocks, web links, and `[[wiki links]]`.
- Create a linked note by clicking an unresolved wiki link.
- Backlinks and automatic wiki-link updates when you rename a note.
- Folders, tags, full-text search, and a selected-note graph view.
- Public GitHub repositories with pagination, descriptions, languages, topics, and READMEs.
- Shared language and topic nodes connect related repositories.
- Import additional documentation or code using its exact repository-relative path.
- Separate personal annotations preserved during repository refresh.
- Automatic local saving, JSON backups, Markdown/text imports, and single-note Markdown export.
- Optional read-only `search_brain` WebMCP tool in browsers that support it.

## GitHub import behavior

Only public repositories **owned by the entered account** are listed. This does not include every repository the user has starred or contributed to. No token or sign-in is used, and the app never writes to GitHub.

All repository metadata pages are fetched. READMEs load sequentially. GitHub can impose request limits; completed imports remain saved, and another import can resume missing READMEs. Changed repositories have their READMEs refreshed when their push timestamp changes. Use **Refresh** on an individual repository to fetch its README directly.

Repository source trees are not downloaded wholesale. To include a document or code file in search, open its repository and enter a path such as `docs/INSTALLATION.md`. Text imports are limited to 200 KB each. Imported source files are editable snapshots; importing the same file again preserves the existing snapshot. Missing or now-private repositories already saved locally are not automatically deleted.

## Saving and backup

Notes are stored in this browser's local storage, not inside `index.html` or a GitHub repository. Use **Export backup** regularly and before clearing browser data or changing computers. The export dialog provides a **Download file** link and the complete copyable file contents, so you can save manually if an embedded browser blocks downloads. Storage capacity varies by browser; the app warns if saving fails.

**Import** accepts a Brain JSON backup or Markdown/text files. Backup notes are merged by ID; existing IDs are preserved. For recovery into an empty installation, import your backup before adding new content.

The initial three notes are editable getting-started examples. Your GitHub data is fetched when you run the import, rather than being bundled into the application source.

## Manual checks performed

The local browser checks covered importing the account's 15 public repositories, displaying a README, importing `ai-crm-system/docs/INSTALLATION.md`, creating and renaming a note, following wiki links, backlinks, full-text search, graph rendering, and persistence after reload. The JavaScript also passed a syntax check.

Markdown support is intentionally small; raw HTML is escaped, remote images are not embedded, and advanced GitHub Markdown features such as tables are displayed as text. This first version has no AI chat or cross-device synchronization.
