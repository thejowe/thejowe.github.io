import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { normalizeRepo } from './normalize';
import type { ApiRepo, GithubSnapshot, RepoStats } from './types';

// Solo se ejecuta en build (frontmatter de Astro). Nunca importar desde un <script> de cliente.
const API = 'https://api.github.com';
const CACHE_FILE = fileURLToPath(new URL('../../../.cache/github.json', import.meta.url));
const TTL_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;

async function gh<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(`${API}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'thejowe-portfolio-build',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} en ${path}`);
  return (await res.json()) as T;
}

async function fetchSnapshot(user: string): Promise<GithubSnapshot> {
  // `/users/{user}/repos` solo devuelve repos públicos.
  const list = await gh<ApiRepo[]>(`/users/${user}/repos?per_page=100&sort=pushed&type=owner`);
  const repos: RepoStats[] = [];
  for (const api of list) {
    if (api.private) continue;
    let langs: Record<string, number> = {};
    if (!api.fork && !api.archived) {
      try {
        langs = await gh<Record<string, number>>(`/repos/${user}/${api.name}/languages`);
      } catch {
        // los lenguajes son opcionales
      }
    }
    repos.push(normalizeRepo(api, langs));
  }
  return { fetchedAt: Date.now(), repos };
}

function isRepoStats(r: unknown): r is RepoStats {
  if (typeof r !== 'object' || r === null) return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.name === 'string' &&
    typeof x.url === 'string' &&
    typeof x.stars === 'number' &&
    Array.isArray(x.languages) &&
    typeof x.archived === 'boolean' &&
    typeof x.fork === 'boolean' &&
    typeof x.isPublic === 'boolean' &&
    (x.pushedAt === null ||
      (typeof x.pushedAt === 'string' && !Number.isNaN(Date.parse(x.pushedAt))))
  );
}

async function readCache(): Promise<GithubSnapshot | null> {
  try {
    const data = JSON.parse(await readFile(CACHE_FILE, 'utf8')) as GithubSnapshot;
    if (!Array.isArray(data?.repos) || typeof data.fetchedAt !== 'number') return null;
    return { fetchedAt: data.fetchedAt, repos: data.repos.filter(isRepoStats) };
  } catch {
    return null;
  }
}

async function writeCache(snapshot: GithubSnapshot): Promise<void> {
  try {
    await mkdir(dirname(CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(snapshot, null, 2));
  } catch {
    // la caché es best-effort
  }
}

let memo: Promise<GithubSnapshot> | undefined;

/**
 * Devuelve los repos públicos del usuario. Nunca lanza: ante fallo o rate limit
 * usa la última caché (aunque esté caducada) o una lista vacía.
 */
export function getGithubSnapshot(user: string): Promise<GithubSnapshot> {
  memo ??= (async () => {
    const cached = await readCache();
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached;
    try {
      const fresh = await fetchSnapshot(user);
      await writeCache(fresh);
      return fresh;
    } catch (err) {
      console.warn(
        `[github] ${(err as Error).message}; se usa ${cached ? 'la caché anterior' : 'una lista vacía'}.`,
      );
      return cached ?? { fetchedAt: 0, repos: [] };
    }
  })();
  return memo;
}
