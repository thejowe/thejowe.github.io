/** Datos de GitHub ya normalizados que consume la UI. */
export interface RepoStats {
  name: string;
  url: string;
  stars: number;
  /** Lenguaje principal. */
  language: string | null;
  /** Lenguajes ordenados por bytes (desc). Vacío si no se pudieron pedir. */
  languages: string[];
  pushedAt: string | null;
  description: string | null;
  archived: boolean;
  fork: boolean;
  /** Repo público (solo se guardan públicos; el campo evita fugas si cambia). */
  isPublic: boolean;
}

export interface GithubSnapshot {
  fetchedAt: number;
  repos: RepoStats[];
}

/** Subconjunto de la respuesta REST que usamos. */
export interface ApiRepo {
  name: string;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  pushed_at: string | null;
  description: string | null;
  archived: boolean;
  fork: boolean;
  private: boolean;
}
