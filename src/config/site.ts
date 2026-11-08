/**
 * Contrato CONGELADO del bloque `arquitecto` (estructura).
 * `contenido` rellena solo los valores de texto marcados como pendientes.
 * Valores `null` = decisión del usuario aún sin responder (D3, D8).
 */

export interface SocialLink {
  /** Etiqueta visible, p. ej. «GitHub». */
  label: string;
  url: string;
}

export interface SiteConfig {
  /** URL de producción, sin barra final (D1). */
  url: string;
  /** Idioma principal (BCP 47). */
  lang: string;
  /** Nombre del sitio, usado en `<title>`. */
  title: string;
  /** Nombre a mostrar de la persona (D3). `null` hasta que lo dé el usuario. */
  name: string | null;
  /** Usuario de GitHub. */
  githubUser: string;
  /** Una frase de posicionamiento (D3). `null` hasta que lo dé el usuario. */
  tagline: string | null;
  /** Descripción por defecto para `<meta name="description">`. */
  description: string;
  /** Email de contacto (D8). `null` hasta que lo dé el usuario. */
  email: string | null;
  /** Enlaces sociales/contacto. */
  social: SocialLink[];
}

export const site: SiteConfig = {
  url: 'https://thejowe.github.io',
  lang: 'es',
  title: 'thejowe',
  name: 'thejowe',
  githubUser: 'thejowe',
  tagline: 'Desarrollo apps móviles y webs con TypeScript.',
  description: 'Portfolio de desarrollo de thejowe: proyectos, código y contacto.',
  email: 'joeldetorres123@gmail.com',
  social: [{ label: 'GitHub', url: 'https://github.com/thejowe' }],
};
