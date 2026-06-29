export interface NavItem {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  url: string;
  /** key into the inline icon set in SocialLinks.astro */
  icon: 'linkedin' | 'github' | 'medium' | 'stackoverflow' | 'appstore' | 'email' | 'rss';
}

export interface Sdk {
  name: string;
  /** short display name without the -ios suffix, e.g. "EventHorizon" */
  displayName: string;
  repoUrl: string;
  description: string;
  tags: string[];
  stars: number;
  language: 'Swift';
}

export interface App {
  name: string;
  category: string;
  blurb: string;
  appStoreUrl: string;
  /** path under /public, e.g. "/apps/engramr.png" */
  iconUrl: string;
  /** featured on the homepage */
  featured?: boolean;
}

export interface ExperienceItem {
  company: string;
  position: string;
  location: string;
  period: string;
  url?: string;
}

export interface Profile {
  name: string;
  headline: string;
  location: string;
  summary: string;
  statement: string;
  experience: ExperienceItem[];
  skills: string[];
}
