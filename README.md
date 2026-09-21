# The Brain

A self-contained second brain for your notes and public GitHub repositories, with a monochrome, rotatable 3D knowledge globe.

The app opens already populated with **all 15 public repositories owned by arnaut560000**, their available root READMEs, and **632 indexed file paths**. This bundled snapshot was collected on September 18, 2026. Empty repositories are included too.

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
5. Explore your projects immediately. Click **Sync** to refresh public GitHub data when you want newer content.

You can also open the HTML directly, but a local server gives browser storage a consistent address. Always use the same browser and address to access saved notes. To stop the server, press Ctrl+C in its terminal.

## Features

- Black, white, and gray interface with a narrow sidebar and one spherical graph. All projects, folders, and files share the same globe; edges still represent their actual relationships.
- The globe is a filled 3D volume with irregular folder neighborhoods, rather than evenly spaced dots on a hollow shell. Files stay close to their project and folders, with stable project positions when files are hidden or filters change.
- A sparse set of real relationships connects the neighborhoods. Per-hub line limits prevent large folders from producing starbursts; selection reveals up to five nearby connections and emphasizes the project's files. No decorative nodes or invented relationships are added. The count includes all relationships, including lines omitted from the overview.
- Drag anywhere on the globe to rotate it. Scroll or pinch to zoom, and use **Fit globe** to recenter it. Arrow keys rotate; +/− zoom; F fits the view.
- Depth shading distinguishes the front and back. Clicking a node or sidebar item rotates that item toward the front and opens its details. Your viewing angle is saved locally.
- Optional **Auto-rotate** / **Pause rotation** controls. Rotation is off by default and stops when you begin interacting with the globe.
- Markdown notes with headings, bullet lists, bold text, code blocks, web links, and `[[wiki links]]`.
- Create a linked note by clicking an unresolved wiki link.
- Backlinks and automatic wiki-link updates when you rename a note.
- Folders, tags, full-text search, and a selected-note graph view.
- Folder focus retains that folder and its files. Technology nodes list their connected projects in the details panel. A size legend distinguishes projects, folders, and files in grayscale.
- All public GitHub repositories prefilled, with descriptions, languages, topics, READMEs, and file indexes. Refresh supports pagination.
- Shared language and topic nodes connect related repositories. Additional technology connections are inferred from README text and file paths.
- Switch the sidebar between Projects, Files, Notes, and All items. The Files checkbox controls file nodes in the globe.
- Select an indexed file and choose **Load file content** to save its text for full-text search. File paths and bundled READMEs are searchable immediately.
- Separate personal annotations preserved during repository refresh.
- Automatic local saving, JSON backups, Markdown/text imports, and single-note Markdown export.
- Optional read-only `search_brain` WebMCP tool in browsers that support it.

## GitHub import behavior

Only public repositories **owned by the entered account** are listed. This does not include every repository the user has starred or contributed to. No token or sign-in is used, and the app never writes to GitHub.

All repository metadata pages are fetched. READMEs and source-file indexes load sequentially. GitHub can impose request limits; completed imports remain saved, and another sync can resume missing content. Changed repositories have their READMEs and indexes refreshed when their push timestamp changes. Use **Refresh** on an individual repository to fetch its README directly.

The bundled app includes every indexed file path, not the complete contents of every source file or binary. Load individual text files as needed; text imports are limited to 200 KB each. Larger files and binaries have an **Open on GitHub** link. Imported source files are editable snapshots; reloading a saved file asks before replacing its content. Missing or now-private repositories already saved locally are not automatically deleted.

## Saving and backup

Notes are stored in this browser's local storage, not inside `index.html` or a GitHub repository. Use **Export backup** regularly and before clearing browser data or changing computers. The export dialog provides a **Download file** link and the complete copyable file contents, so you can save manually if an embedded browser blocks downloads. Storage capacity varies by browser; the app warns if saving fails.

**Import** accepts a Brain JSON backup or Markdown/text files. Backup notes are merged by ID; existing IDs are preserved. For recovery into an empty installation, import your backup before adding new content.

Existing personal notes and annotations are preserved when this version adds the bundled projects to browser storage. Incomplete catalogs are repaired on startup even when their saved snapshot version is current, including missing empty repositories. Unedited getting-started examples from the first version are removed. Locally removed bundled items are remembered, so reopening the app does not recreate them.

## Refresh the bundled snapshot

The app itself still needs only `index.html`. The optional Node.js maintenance script regenerates the embedded public snapshot for future copies of the app:

```powershell
node scripts/sync-public-repos.mjs
```

It checks the public repository list, fetches complete file trees, includes available root READMEs, and safely embeds the JSON. It stops without writing a partial snapshot if a tree is incomplete or a request fails. It never reads private repositories or uses a token.

## Manual checks performed

The initial version's browser checks covered GitHub imports, README display, document import, editing, backlinks, search, and persistence. For this update, run the dependency-free checks with:

```powershell
node scripts/check-app.mjs
```

These verify the bundled repository and file counts, monochrome theme, spherical geometry, interior node density, file proximity, stable project positions, per-hub and selection line limits, perspective fitting, rotation, bringing a selected node to the front, drag and pinch gestures, auto-rotation, folder focus, technology details, repair of incomplete catalogs, preservation of existing notes and deliberate removals, persistence, indexed-file loading, repository refresh, and storage failure handling. Network behavior is mocked in these checks; the bundled snapshot itself was fetched from the live public GitHub API. The latest visual pass checked the filled globe, selected project, keyboard rotation, and file visibility at the browser's normal 1280×720 viewport, with no browser errors reported.

Markdown support is intentionally small; raw HTML is escaped, remote images are not embedded, and advanced GitHub Markdown features such as tables are displayed as text. This first version has no AI chat or cross-device synchronization.
