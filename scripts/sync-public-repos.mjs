// Refresh the public project snapshot embedded in index.html. No token required.
import { readFile, writeFile } from 'node:fs/promises';
const user = 'arnaut560000';
async function get(path) {
  const response = await fetch('https://api.github.com' + path, {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const error = new Error(`GitHub ${response.status}: ${path}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}
const repos = [];
for (let page = 1; ; page++) {
  const batch = await get(`/users/${user}/repos?type=owner&sort=full_name&per_page=100&page=${page}`);
  repos.push(...batch.filter(repo => repo.private === false));
  if (batch.length < 100) break;
}
const snapshot = { user, generated: new Date().toISOString(), projects: [] };
for (const repo of repos) {
  let files = [];
  try {
    const tree = await get(`/repos/${repo.full_name}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`);
    if (tree.truncated) throw new Error(`Incomplete file tree for ${repo.full_name}; snapshot not written.`);
    files = tree.tree.filter(entry => entry.type === 'blob').map(({ path, size, sha }) => ({ path, size: size || 0, sha }));
  } catch (error) {
    // GitHub returns 409 for a repository that has no commits.
    if (error.status !== 409) throw error;
  }
  const readmeFile = files.find(file => /^readme(?:\.[^/]+)?$/i.test(file.path));
  let readme = 'This repository has no root README yet.';
  if (readmeFile) {
    const url = `https://raw.githubusercontent.com/${repo.full_name}/${encodeURIComponent(repo.default_branch)}/${readmeFile.path.split('/').map(encodeURIComponent).join('/')}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Could not read README for ${repo.full_name}`);
    readme = await response.text();
  }
  snapshot.projects.push({
    id: 'repo:' + repo.id, title: repo.name, full: repo.full_name, kind: 'repo',
    folder: 'GitHub', tags: [...new Set([repo.language, ...repo.topics].filter(Boolean))],
    remoteTags: [...new Set([repo.language, ...repo.topics].filter(Boolean))],
    language: repo.language || '', description: repo.description || '',
    branch: repo.default_branch, pushed: repo.pushed_at, stars: repo.stargazers_count,
    body: '', readme, readmeState: readmeFile ? 'loaded' : 'missing',
    files, synced: snapshot.generated,
  });
  console.log(`${repo.name}: ${files.length} files, ${readmeFile ? 'README included' : 'no README'}`);
}
const file = new URL('../index.html', import.meta.url);
const html = await readFile(file, 'utf8');
const block = '<script type="application/json" id="projectSeed">' + JSON.stringify(snapshot).replaceAll('<', '\\u003c') + '</script>';
const updated = html.includes('id="projectSeed"')
  ? html.replace(/<script type="application\/json" id="projectSeed">[\s\S]*?<\/script>/, () => block)
  : html.replace("<script>\n'use strict';", block + "\n<script>\n'use strict';");
if (updated === html) throw new Error('Snapshot insertion failed');
await writeFile(file, updated);
console.log(`Embedded ${repos.length} public repositories and ${snapshot.projects.reduce((sum, repo) => sum + repo.files.length, 0)} file paths.`);
