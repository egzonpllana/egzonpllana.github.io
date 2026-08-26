import type { App } from '../types';

import engramr from '../assets/apps/engramr.png';
import firstPrinciplesPhysics from '../assets/apps/first-principles-physics.png';
import fishCare from '../assets/apps/fish-care.png';
import feedMyDog from '../assets/apps/feed-my-dog.png';
import readHabit from '../assets/apps/read-habit.png';
import walkMyDog from '../assets/apps/walk-my-dog.png';

/**
 * App Store apps (developer id 1315313322).
 * Icons are vendored under src/assets/apps/ (downloaded from the iTunes lookup API).
 * `featured: true` apps surface on the homepage (a diverse mix of categories).
 */
export const APPS: App[] = [
  {
    name: 'Engramr - Reminders & Alarms',
    category: 'Productivity',
    blurb:
      'Smart reminders and alarms that sync across iPhone, iPad, Mac and Apple Watch - keep your day simple and stress-free.',
    appStoreUrl:
      'https://apps.apple.com/us/app/engramr-reminders-alarms/id1506049485',
    icon: engramr,
    featured: true,
  },
  {
    name: 'First Principles: Physics',
    category: 'Education',
    blurb:
      'More than twenty pieces of physics simulated on device - move a control and the model is re-solved and redrawn, because it was never a picture.',
    appStoreUrl:
      'https://apps.apple.com/us/app/first-principles-physics/id6800736839',
    icon: firstPrinciplesPhysics,
    featured: true,
  },
  {
    name: 'Fish Care - AI Planner',
    category: 'Lifestyle',
    blurb:
      'Build and manage a complete care routine for your fish, with smart scheduling across feeding, water and tank tasks.',
    appStoreUrl:
      'https://apps.apple.com/us/app/fish-care-ai-planner/id6760917397',
    icon: fishCare,
    featured: true,
  },
  {
    name: 'Feed My Dog - AI Meal Planner',
    category: 'Food & Drink',
    blurb:
      'Smart, breed-tailored meal plans based on your dog’s unique profile.',
    appStoreUrl:
      'https://apps.apple.com/us/app/feed-my-dog-ai-meal-planner/id6760208958',
    icon: feedMyDog,
    featured: true,
  },
  {
    name: 'Read Habit - AI Planner',
    category: 'Books',
    blurb:
      'Build and maintain a consistent reading habit with smart planning tools.',
    appStoreUrl:
      'https://apps.apple.com/us/app/read-habit-ai-planner/id6761147141',
    icon: readHabit,
    featured: true,
  },
  {
    name: 'Walk My Dog - AI Smart Planner',
    category: 'Lifestyle',
    blurb: 'AI-generated, breed-tailored walk plans for your dog.',
    appStoreUrl:
      'https://apps.apple.com/us/app/walk-my-dog-ai-smart-planner/id6760465177',
    icon: walkMyDog,
  },
];

export const FEATURED_APPS = APPS.filter((app) => app.featured);
