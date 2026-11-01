// Posts the merged PR's release note to /api/admin/releases. Run by .github/workflows/release-notes.yml.
// Needs GITHUB_EVENT_PATH (set by Actions), RELEASES_API_URL and RELEASES_CI_TOKEN.
import fs from 'fs';
import { parseReleaseNote } from '../server/lib/release-note.mjs';

const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const pr = event.pull_request;
if (!pr?.merged) {
  console.log('Not a merged pull request; nothing to post.');
  process.exit(0);
}
const note = parseReleaseNote(pr.body);
if (!note) {
  console.log(`PR #${pr.number} has no filled release note; nothing to post.`);
  process.exit(0);
}
const response = await fetch(`${process.env.RELEASES_API_URL.replace(/\/+$/, '')}/api/admin/releases`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RELEASES_CI_TOKEN}` },
  body: JSON.stringify({ pr_number: pr.number, commit_sha: pr.merge_commit_sha, ...note }),
});
const text = await response.text();
if (!response.ok) {
  console.error(`Posting the release note failed with ${response.status}: ${text}`);
  process.exit(1);
}
console.log(`Posted release note for PR #${pr.number} (${note.category}).`);
