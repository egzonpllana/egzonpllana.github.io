import type { App } from '../types';

/**
 * App Store apps (developer id 1315313322).
 * Icons are vendored under /public/apps/ (downloaded from the iTunes lookup API).
 * `featured: true` apps surface on the homepage (a diverse mix of categories).
 */
export const APPS: App[] = [
  {
    name: 'Engramr — Reminders & Alarms',
    category: 'Productivity',
    blurb: 'Smart reminders and alarms that sync across iPhone, iPad, Mac and Apple Watch — keep your day simple and stress-free.',
    appStoreUrl: 'https://apps.apple.com/us/app/engramr-reminders-alarms/id1506049485',
    iconUrl: '/apps/engramr.png',
    featured: true,
  },
  {
    name: 'Eat Once — Body Rhythm',
    category: 'Food & Drink',
    blurb: 'Not all foods are meant to be eaten at the same frequency — eat in rhythm with your body.',
    appStoreUrl: 'https://apps.apple.com/us/app/eat-once-body-rhythm/id6762008329',
    iconUrl: '/apps/eat-once.png',
    featured: true,
  },
  {
    name: 'Fish Care — AI Planner',
    category: 'Lifestyle',
    blurb: 'Build and manage a complete care routine for your fish, with smart scheduling across feeding, water and tank tasks.',
    appStoreUrl: 'https://apps.apple.com/us/app/fish-care-ai-planner/id6760917397',
    iconUrl: '/apps/fish-care.png',
    featured: true,
  },
  {
    name: 'PlantCare — AI Planner',
    category: 'Lifestyle',
    blurb: 'The all-in-one app for keeping your plants thriving with tailored care schedules and reminders.',
    appStoreUrl: 'https://apps.apple.com/us/app/plantcare-ai-planner/id6761417775',
    iconUrl: '/apps/plantcare.png',
  },
  {
    name: 'Feed My Dog — AI Meal Planner',
    category: 'Food & Drink',
    blurb: 'Smart, breed-tailored meal plans based on your dog’s unique profile.',
    appStoreUrl: 'https://apps.apple.com/us/app/feed-my-dog-ai-meal-planner/id6760208958',
    iconUrl: '/apps/feed-my-dog.png',
  },
  {
    name: 'Feed My Cat — AI Meal Planner',
    category: 'Lifestyle',
    blurb: 'AI-generated, breed-tailored meal plans for your cat.',
    appStoreUrl: 'https://apps.apple.com/us/app/feed-my-cat-ai-meal-planner/id6760629634',
    iconUrl: '/apps/feed-my-cat.png',
  },
  {
    name: 'Walk My Dog — AI Smart Planner',
    category: 'Lifestyle',
    blurb: 'AI-generated, breed-tailored walk plans for your dog.',
    appStoreUrl: 'https://apps.apple.com/us/app/walk-my-dog-ai-smart-planner/id6760465177',
    iconUrl: '/apps/walk-my-dog.png',
  },
  {
    name: 'Read Habit — AI Planner',
    category: 'Books',
    blurb: 'Build and maintain a consistent reading habit with smart planning tools.',
    appStoreUrl: 'https://apps.apple.com/us/app/read-habit-ai-planner/id6761147141',
    iconUrl: '/apps/read-habit.png',
  },
];

export const FEATURED_APPS = APPS.slice(0, 5);
