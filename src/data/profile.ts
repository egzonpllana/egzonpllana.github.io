import type { Profile } from '../types';

export const PROFILE: Profile = {
  name: 'Egzon Pllana',
  headline: 'Senior iOS Engineer · SDK & Mobile Architect',
  location: 'Kosovo (Europe) · Remote',
  availability: 'Open to senior / staff iOS & SDK roles',
  summary:
    'Engineer with 15 years across the field - over 10 of them focused on iOS and Swift - built on a foundation in electronics.',
  statement:
    'I build mostly SDKs - the layer other engineers depend on. Networking, dependency injection, navigation, geospatial, audio DSP, and 3D capture: small public APIs over carefully engineered internals, each with a clean architecture and a real test suite.',
  experience: [
    {
      focus: 'Platform layer',
      title: 'SDK & framework architecture',
      summary:
        'Most of my work is the layer other engineers build on - small public APIs over carefully engineered internals.',
      highlights: [
        'Consumed by production banking and healthcare apps in the hands of millions of users - the SDK layer renders on screen in every single session.',
        'Maintained Swift packages spanning networking, dependency injection, navigation, geospatial clustering, real-time audio DSP, 3D photogrammetry, and WebKit bridging.',
        'A zero-dependency DI framework holding 1,000+ unit tests at constant per-test overhead, with transient, singleton, and weak-cache policies.',
        'A multi-module design system SDK with semantic versioning that removed duplicated components across a bank’s mobile apps.',
        'Every package is protocol-first, fully injectable, and built for Swift 6 strict concurrency - actors, Sendable, async/await.',
      ],
    },
    {
      focus: 'Regulated production',
      title: 'Shipping apps that have to hold up',
      summary:
        'A decade of senior iOS work in FinTech and HealthTech, where the app faces real users, audits, and unreliable hardware.',
      highlights: [
        'Apple App Attest with per-device Secure Enclave key attestation, replacing static secrets shipped inside the app binary.',
        'A type-safe localization SDK with OTA delivery, so copy changes across 14 languages ship without an App Store release.',
        'A BLE layer hardened above CoreBluetooth so patient-monitoring data acquisition survives intermittent radio conditions.',
        'An offline demo runtime with isolated multi-instance databases, keychain, and network, running the medical app with no backend.',
      ],
    },
    {
      focus: 'Systems & performance',
      title: 'Problems that need an algorithm, not a framework',
      summary:
        'The work that comes down to data structures, SIMD, and a profiler - measured, not guessed.',
      highlights: [
        'A K-D tree over an embedded 167K-city database clusters 8,000+ geotagged photos into travel events in 2-5s - about 0.01 ms per geocode, against roughly 3 hours rate-limited.',
        'Real-time audio DSP: 100-band amplitude analysis through Accelerate vDSP over ~0.8s chunks, with dual resampling paths.',
        'A RealityKit photogrammetry pipeline emitting USDZ with computed physical dimensions, plus defensive iOS 26 std::bad_alloc mitigation.',
        'Silent memory-leak and crash-rate work that kept 4 production apps above a 4.0 App Store rating.',
      ],
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
