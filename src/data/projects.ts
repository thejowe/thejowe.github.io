import type { Project } from '../types/project';

/**
 * Capa curada de proyectos.
 * Solo se muestran repos públicos o `private-showcase` con decisión explícita (D4).
 * D4 sin responder: ningún repo privado aparece aquí. Un privado «oculto» es
 * simplemente un repo ausente de este array.
 *
 * Los `summary` son descriptivos y provisionales (solo hechos verificables del
 * repo), redactados por `contenido`.
 */
export const projects: Project[] = [
  {
    slug: 'lockin',
    title: 'Cofounder',
    summary:
      'App móvil con Expo y React Native, backend en Supabase (migraciones, funciones y tests de esquema), interfaz en español, inglés y catalán, y suscripciones con RevenueCat.',
    role: 'Desarrollo completo',
    stack: ['TypeScript'],
    repo: 'https://github.com/thejowe/lockin',
    visibility: 'public',
    featured: true,
    order: 1,
    year: 2026,
    status: 'active',
  },
  {
    slug: 'cofounder-web',
    title: 'Cofounder Web',
    summary:
      'Web estática en HTML y CSS de la app cofounder: privacidad, términos, normas, seguridad infantil, soporte y eliminación de cuenta.',
    role: 'Desarrollo completo',
    stack: ['HTML'],
    repo: 'https://github.com/thejowe/cofounder-web',
    visibility: 'public',
    featured: true,
    order: 2,
    year: 2026,
    status: 'maintained',
  },
  {
    slug: 'ninjex',
    title: 'Ninjex',
    summary:
      'Vertical slice de combate cooperativo ninja en Godot 4.7, con modo en red (NetworkManager) y todo el código en GDScript.',
    role: 'Desarrollo completo',
    stack: ['GDScript', 'Godot'],
    repo: 'https://github.com/thejowe/ninjex',
    visibility: 'public',
    featured: true,
    order: 3,
    year: 2026,
    status: 'prototype',
  },
  {
    slug: 'gamblex',
    title: 'Gamblex',
    summary:
      'Casino multijugador en pixel art hecho con Godot 4.7: red, integración con Steam, audio y tests.',
    role: 'Desarrollo completo',
    stack: ['GDScript', 'Godot'],
    repo: 'https://github.com/thejowe/gamblex',
    visibility: 'public',
    featured: true,
    order: 4,
    year: 2026,
    status: 'prototype',
  },
  {
    slug: 'circuit',
    title: 'Circuit',
    summary:
      'Circuito de supercross en 3D que se ejecuta en el navegador, en un único archivo HTML con controles en pantalla.',
    role: 'Desarrollo completo',
    stack: ['HTML'],
    repo: 'https://github.com/thejowe/circuit',
    visibility: 'public',
    featured: true,
    order: 5,
    year: 2026,
    status: 'prototype',
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
