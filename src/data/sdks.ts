import type { Sdk } from '../types';

/**
 * Public Swift SDKs from github.com/egzonpllana.
 * Star counts and creation dates are a static snapshot (kept offline by
 * design); update manually. Listed stars desc - the homepage picks its own
 * five by `created`, so this order is for reading, not for rendering.
 */
export const SDKS: Sdk[] = [
  {
    name: 'interactive-image-view-ios',
    displayName: 'InteractiveImageView',
    repoUrl: 'https://github.com/egzonpllana/interactive-image-view-ios',
    description:
      'A simple UIView to interact with an image: scroll, zoom, pinch and crop - drop-in and configurable.',
    tags: ['UIKit', 'Image', 'Gestures', 'Crop'],
    stars: 49,
    created: '2022-08-25',
    language: 'Swift',
  },
  {
    name: 'codable-files-ios',
    displayName: 'CodableFiles',
    repoUrl: 'https://github.com/egzonpllana/codable-files-ios',
    description:
      'Save and load Codable objects to and from the Document directory on iOS with a tiny, type-safe API.',
    tags: ['Codable', 'Persistence', 'FileManager'],
    stars: 43,
    created: '2022-01-02',
    language: 'Swift',
  },
  {
    name: 'memory-profiler-ios',
    displayName: 'MemoryProfiler',
    repoUrl: 'https://github.com/egzonpllana/memory-profiler-ios',
    description:
      'Real-time memory monitoring, leak detection, and usage analytics for iOS apps - instrument without Instruments.',
    tags: ['Profiling', 'Leaks', 'Diagnostics'],
    stars: 41,
    created: '2025-07-27',
    language: 'Swift',
  },
  {
    name: 'network-layer-swift-6',
    displayName: 'NetworkLayer',
    repoUrl: 'https://github.com/egzonpllana/network-layer-swift-6',
    description:
      'A generic, thread-safe networking layer built on the latest Swift 6 concurrency APIs to avoid data races and crashes.',
    tags: ['Networking', 'Swift 6', 'async/await', 'Sendable'],
    stars: 27,
    created: '2024-08-25',
    language: 'Swift',
  },
  {
    name: 'event-horizon-ios',
    displayName: 'EventHorizon',
    repoUrl: 'https://github.com/egzonpllana/event-horizon-ios',
    description:
      'A lightweight, thread-safe package for a clean network communication layer using Sendable-constrained generics and async/await.',
    tags: ['Networking', 'Generics', 'Concurrency'],
    stars: 17,
    created: '2025-03-18',
    language: 'Swift',
  },
  {
    name: 'EMediaPicker',
    displayName: 'EMediaPicker',
    repoUrl: 'https://github.com/egzonpllana/EMediaPicker',
    description:
      'The simplest possible implementation over AVCaptureSession, AssetsLibrary and Photos - camera capture and library picking behind one API.',
    tags: ['Media', 'Camera', 'Photos', 'AVFoundation'],
    stars: 12,
    created: '2019-12-24',
    language: 'Swift',
  },
  {
    name: 'localization-engine-ios',
    displayName: 'LocalizationEngine',
    repoUrl: 'https://github.com/egzonpllana/localization-engine-ios',
    description:
      'Type-safe localization SDK with over-the-air delivery, so copy ships across languages without an App Store release.',
    tags: ['Localization', 'OTA', 'i18n'],
    stars: 4,
    created: '2026-02-20',
    language: 'Swift',
  },
  {
    name: 'phaseshift-ios',
    displayName: 'PhaseShift',
    repoUrl: 'https://github.com/egzonpllana/phaseshift-ios',
    description:
      'Elegant modal presentation with custom phase-shift transition animations - a lightweight Swift package.',
    tags: ['SwiftUI', 'Transitions', 'Animation'],
    stars: 4,
    created: '2025-12-04',
    language: 'Swift',
  },
  {
    name: 'geo-clustering-ios',
    displayName: 'GeoClustering',
    repoUrl: 'https://github.com/egzonpllana/geo-clustering-ios',
    description:
      'Offline geospatial clustering engine - groups thousands of geotagged photos into labeled travel events in seconds via a K-D tree over an embedded GeoNames database.',
    tags: ['Geospatial', 'K-D Tree', 'Offline-First', 'Performance'],
    stars: 1,
    created: '2026-04-09',
    language: 'Swift',
  },
  {
    name: 'conduit-ios',
    displayName: 'Conduit',
    repoUrl: 'https://github.com/egzonpllana/conduit-ios',
    description:
      'A generic, protocol-driven UIKit navigation framework for SwiftUI apps: push, present, sheet detents and root swaps under Swift 6 strict concurrency.',
    tags: ['Navigation', 'UIKit', 'SwiftUI', 'Swift 6'],
    stars: 0,
    created: '2026-03-04',
    language: 'Swift',
  },
  {
    name: 'orbitcore-ios',
    displayName: 'OrbitCore',
    repoUrl: 'https://github.com/egzonpllana/orbitcore-ios',
    description:
      'A lightweight, thread-safe dependency-injection framework with transient, singleton and weak-cache policies, an @Injected wrapper, and zero third-party dependencies.',
    tags: ['Dependency Injection', 'Thread-Safety', 'Property Wrappers'],
    stars: 0,
    created: '2026-02-25',
    language: 'Swift',
  },
];
