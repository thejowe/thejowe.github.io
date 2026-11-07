/**
 * Contrato CONGELADO del bloque `arquitecto`.
 * Cambios solo avisando a los demás bloques (ver docs/plan/todo/arquitecto.md).
 */

/** `public`: repo público. `private-showcase`: privado, publicable por decisión explícita (D4). */
export type ProjectVisibility = 'public' | 'private-showcase';

/** Estado del proyecto. */
export type ProjectStatus = 'active' | 'maintained' | 'archived' | 'prototype';

export interface Project {
  /** Identificador estable y de URL: `/proyectos/<slug>`. Minúsculas, números y guiones. */
  slug: string;
  title: string;
  /** Una o dos frases, sin adjetivos huecos. */
  summary: string;
  /** Rol de quien lo construyó (p. ej. «Desarrollo completo»). */
  role: string;
  /** Tecnologías, en orden de relevancia. */
  stack: string[];
  /** URL del repositorio. Omitir si es privado y no se enlaza. */
  repo?: string;
  /** URL de la demo desplegada. */
  demo?: string;
  visibility: ProjectVisibility;
  /** Si aparece en «Proyectos destacados» y tiene página de detalle. */
  featured: boolean;
  /** Orden ascendente dentro de su grupo (menor = antes). */
  order: number;
  /** Año de inicio o publicación (4 dígitos). */
  year: number;
  status: ProjectStatus;
}
