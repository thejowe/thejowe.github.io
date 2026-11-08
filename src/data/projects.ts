import type { Project } from '../types/project';

/**
 * Capa curada de proyectos.
 * Solo se muestran repos públicos o `private-showcase` con decisión explícita (D4).
 * D4 sin responder: ningún repo privado aparece aquí. Un privado «oculto» es
 * simplemente un repo ausente de este array.
 *
 */
export const projects: Project[] = [
  {
    slug: 'lockin',
    title: 'Cofounder',
    summary:
      'Encuentra con quién fundar: desliza perfiles de personas que quieren empezar algo, haz match cuando el interés es mutuo y conversa para ver si encajáis como cofundadores.',
    details: [
      'Cofounder es una app móvil para gente que todavía no tiene proyecto, equipo ni cofundador y quiere encontrar con quién construir algo.',
      'Creas tu perfil con tus especialidades, lo que buscas, tu punto de partida, tu disponibilidad y tu nivel de compromiso. Después deslizas perfiles; cuando el interés es mutuo hay match y se abre un chat para ver si encajáis.',
      'Los dos lados de un match son pares: nadie contrata a nadie. Está pensada para mayores de 16 años y está disponible en español, inglés y catalán.',
    ],
    role: 'Diseño y desarrollo',
    stack: ['React Native', 'Expo', 'TypeScript', 'Supabase'],
    demo: 'https://thejowe.github.io/cofounder-web/',
    visibility: 'public',
    featured: true,
    order: 1,
    year: 2026,
    status: 'active',
  },
];

/**
 * Repos de GitHub que nunca deben salir en «otros repos» aunque sean públicos
 * (nombre en minúsculas).
 */
export const excludedRepos: readonly string[] = [];

// --- Helpers puros -------------------------------------------------------

export const byOrder = (a: Project, b: Project): number =>
  a.order - b.order || b.year - a.year || a.slug.localeCompare(b.slug);

export const getFeatured = (list: readonly Project[] = projects): Project[] =>
  list.filter((p) => p.featured).sort(byOrder);

export const getNonFeatured = (list: readonly Project[] = projects): Project[] =>
  list.filter((p) => !p.featured).sort(byOrder);

export const sortByYearDesc = (list: readonly Project[] = projects): Project[] =>
  [...list].sort((a, b) => b.year - a.year || byOrder(a, b));

export const getBySlug = (slug: string, list: readonly Project[] = projects): Project | undefined =>
  list.find((p) => p.slug === slug);

/** Nombre del repo (minúsculas) a partir de su URL de GitHub. */
export const repoName = (project: Project): string | undefined =>
  project.repo?.match(/github\.com\/[^/]+\/([^/?#]+)/)?.[1]?.toLowerCase();
