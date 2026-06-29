import type { Profile } from '../types';

export const PROFILE: Profile = {
  name: 'Egzon Pllana',
  headline: 'Senior iOS Engineer · SDK & Mobile Architect',
  location: 'Kosovo (Europe) · Remote',
  summary:
    'Engineer with 15 years across the field — over 10 of them focused on iOS and Swift — built on a foundation in electronics. I design protocol-first, fully testable Swift packages engineered for Swift 6 strict concurrency (actors, Sendable, async/await), shipping production frameworks across FinTech and HealthTech while owning architecture, review, and production quality end to end.',
  statement:
    'I build mostly SDKs — the layer other engineers depend on. Networking, dependency injection, navigation, geospatial, audio DSP, and 3D capture: small public APIs over carefully engineered internals, each with a clean architecture and a real test suite.',
  experience: [
    {
      company: 'Raiffeisen Bank International AG',
      position: 'Senior iOS Engineer / Architect',
      location: 'Austria (Remote) · FinTech',
      period: '05/2024 – Present',
      url: 'https://rbinternational.com',
    },
    {
      company: 'Mentor Mate LLC',
      position: 'Senior iOS Engineer',
      location: 'United States (Remote) · HealthTech',
      period: '11/2021 – 05/2024',
      url: 'https://mentormate.com',
    },
    {
      company: 'Apper GmbH',
      position: 'Senior iOS Engineer',
      location: 'Switzerland (Remote)',
      period: '10/2019 – 11/2021',
      url: 'https://apper.ch',
    },
    {
      company: 'The Social Plus LLC',
      position: 'iOS Engineer',
      location: 'Kosovo',
      period: '05/2017 – 10/2019',
      url: 'http://thesocialplus.com',
    },
  ],
  skills: [
    'SDK Architecture & Swift Package Manager',
    'Swift 6 Strict Concurrency (async/await, Sendable)',
    'Clean Architecture & MVVM-C',
    'Dependency Injection Frameworks',
    'Test-Driven Development (1,000+ tests)',
    'SwiftUI & Design Systems',
    'iOS Security (App Attest, Secure Enclave)',
    'Performance Optimization & Offline-First',
    'RealityKit, ARKit & 3D Capture',
    'Audio Engineering & DSP (vDSP)',
    'Geospatial & Spatial Algorithms',
    'AI-Assisted / Agentic Development',
  ],
};
