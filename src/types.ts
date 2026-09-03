import type { ImageMetadata } from 'astro';

export interface NavItem {
  label: string;
  href: string;
  /** Extra path prefixes that mark this item active, for pages outside `href`. */
  alsoActiveFor?: string[];
}

export interface SocialLink {
  label: string;
  url: string;
  /** key into the inline icon set in SocialLinks.astro */
  icon:
    | 'linkedin'
    | 'github'
    | 'medium'
    | 'stackoverflow'
    | 'appstore'
    | 'email'
    | 'rss';
}

export interface Sdk {
  name: string;
  /** short display name without the -ios suffix, e.g. "EventHorizon" */
  displayName: string;
  repoUrl: string;
  description: string;
  tags: string[];
  stars: number;
  /** Repository creation date, ISO yyyy-mm-dd. Drives the homepage order. */
  created: string;
  language: 'Swift';
}

export interface App {
  name: string;
  category: string;
  blurb: string;
  appStoreUrl: string;
  /** icon asset imported from src/assets/apps */
  icon: ImageMetadata;
  /** featured on the homepage */
  featured?: boolean;
}

export interface ExperienceShowcase {
  /** Short domain label above the title, e.g. "Platform layer". */
  focus: string;
  title: string;
  summary: string;
  /** Concrete, verifiable proof points for this area of work. */
  highlights: string[];
}

export interface Profile {
  name: string;
  headline: string;
  location: string;
  availability: string;
  summary: string;
  statement: string;
  experience: ExperienceShowcase[];
  skills: string[];
}
