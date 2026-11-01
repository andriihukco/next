// Reads the release-note block of a PR body (.github/pull_request_template.md):
//   Release note (uk): <one sentence>
//   Category: new | improved | fixed | internal
// Returns null when the note is missing or still shows the template text.

export const RELEASE_CATEGORIES = ['new', 'improved', 'fixed', 'internal'];

export function parseReleaseNote(body) {
  if (typeof body !== 'string') return null;
  const text = body.replace(/<!--[\s\S]*?-->/g, '');
  const title = (text.match(/^Release note \(uk\):[ \t]*(.*)$/m) || [])[1]?.trim();
  const category = (text.match(/^Category:[ \t]*(.*)$/m) || [])[1]?.trim().toLowerCase();
  if (!title || title.length > 200) return null;
  if (!RELEASE_CATEGORIES.includes(category)) return null;
  return { title_uk: title, category };
}

/** Validates the body CI posts to /api/admin/releases. Returns the row or an error message. */
export function releaseRowFrom(payload) {
  if (!payload || typeof payload !== 'object') return { error: 'A JSON body is required.' };
  const prNumber = Number(payload.pr_number);
  if (!Number.isInteger(prNumber) || prNumber <= 0) return { error: 'pr_number must be a positive integer.' };
  if (!RELEASE_CATEGORIES.includes(payload.category)) return { error: 'category is not valid.' };
  const title = typeof payload.title_uk === 'string' ? payload.title_uk.trim() : '';
  if (!title || title.length > 200) return { error: 'title_uk must be 1 to 200 characters.' };
  const sha = typeof payload.commit_sha === 'string' ? payload.commit_sha : null;
  if (sha !== null && !/^[0-9a-f]{7,40}$/.test(sha)) return { error: 'commit_sha is not a git SHA.' };
  const preview = typeof payload.preview_url === 'string' ? payload.preview_url : null;
  if (preview !== null && !preview.startsWith('https://')) return { error: 'preview_url must use https.' };
  return {
    row: { pr_number: prNumber, category: payload.category, title_uk: title, commit_sha: sha, preview_url: preview },
  };
}
