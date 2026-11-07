import type { ApiRepo, RepoStats } from './types';

export function normalizeRepo(api: ApiRepo, languages: Record<string, number> = {}): RepoStats {
  return {
    name: api.name,
    url: api.html_url,
    stars: api.stargazers_count ?? 0,
    language: api.language ?? null,
    languages: Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang),
    pushedAt: api.pushed_at ?? null,
    description: api.description ?? null,
    archived: Boolean(api.archived),
    fork: Boolean(api.fork),
    isPublic: !api.private,
  };
}

/** Busca las stats de un repo por nombre (minúsculas). */
export function statsFor(
  repos: readonly RepoStats[],
  name: string | undefined,
): RepoStats | undefined {
  if (!name) return undefined;
  return repos.find((r) => r.name.toLowerCase() === name.toLowerCase());
}

/**
 * «Otros repos»: públicos, sin forks, sin archivados, sin los ya curados
 * ni los excluidos explícitamente. Orden: más reciente primero.
 */
export function otherRepos(
  repos: readonly RepoStats[],
  curatedNames: readonly (string | undefined)[],
  excluded: readonly string[] = [],
): RepoStats[] {
  const skip = new Set(
    [...curatedNames, ...excluded]
      .filter((n): n is string => Boolean(n))
      .map((n) => n.toLowerCase()),
  );
  return repos
    .filter((r) => r.isPublic && !r.fork && !r.archived && !skip.has(r.name.toLowerCase()))
    .sort((a, b) => (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''));
}
