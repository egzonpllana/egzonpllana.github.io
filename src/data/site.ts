import type { NavItem, SocialLink } from '../types';

export const SITE = {
  /** Production canonical URL — swap if you point a custom domain here. */
  url: 'https://egzonpllana.github.io',
  name: 'Egzon Pllana',
  title: 'Egzon Pllana — Senior iOS Engineer & SDK Architect',
  description:
    'Senior iOS engineer and SDK architect. I build production Swift SDKs and ship App Store apps. Articles on Swift 6 concurrency, SDK design, and iOS architecture.',
  author: 'Egzon Pllana',
  email: 'docpllana@gmail.com',
  locale: 'en',
} as const;

export const NAV: NavItem[] = [
  { label: 'Portfolio', href: '/' },
  { label: 'Articles', href: '/articles' },
  { label: 'Contact', href: '/contact' },
];

export const SOCIALS: SocialLink[] = [
  { label: 'LinkedIn', url: 'https://linkedin.com/in/egzon-pllana', icon: 'linkedin' },
  { label: 'GitHub', url: 'https://github.com/egzonpllana', icon: 'github' },
  { label: 'Medium', url: 'https://medium.com/@egzonpllana', icon: 'medium' },
  { label: 'Stack Overflow', url: 'https://stackoverflow.com/users/7987502/egzon-p', icon: 'stackoverflow' },
  { label: 'App Store', url: 'https://apps.apple.com/us/developer/egzon-pllana/id1315313322', icon: 'appstore' },
];

export const APP_STORE_DEVELOPER_URL = 'https://apps.apple.com/us/developer/egzon-pllana/id1315313322';
