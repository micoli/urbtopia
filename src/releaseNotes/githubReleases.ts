import { parseReleaseNote, type PublishedRelease } from './releaseNote';

export const RELEASES_URL = 'https://api.github.com/repos/micoli/urbtopia/releases?per_page=100';

interface GithubRelease {
  tag_name: string;
  published_at: string | null;
  created_at: string;
  body: string | null;
}

const isGithubRelease = (value: unknown): value is GithubRelease =>
  typeof value === 'object' && value !== null && typeof (value as GithubRelease).tag_name === 'string';

// Newest first. The GitHub API answers with CORS headers, unlike the download of a release file.
export async function fetchReleases(fetchImpl: typeof fetch = fetch): Promise<readonly PublishedRelease[]> {
  try {
    const response = await fetchImpl(RELEASES_URL);
    if (!response.ok) return [];
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];
    return data.filter(isGithubRelease).map(release => ({
      id: release.tag_name,
      publishedAt: release.published_at ?? release.created_at,
      note: parseReleaseNote(typeof release.body === 'string' ? release.body : null),
    }));
  } catch {
    return [];
  }
}
