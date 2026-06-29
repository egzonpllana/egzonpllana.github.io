---
title: '6 Problems With NSLocalizedString That Made Me Build LocalizationEngine SDK'
description: 'Why Apple''s built-in localization tools fall short for multi-language iOS apps, and the open-source Swift Package I built to fix them.'
date: 2026-03-08
tags: ['iOS', 'Swift', 'Localization', 'SwiftUI', 'Mobile App Development']
heroImage: '/articles/covers/six-problems-with-nslocalizedstring.png'
repoUrl: 'https://github.com/egzonpllana/localization-engine-ios'
---

If you've shipped an iOS app in more than one language, you know the pain. You start with `NSLocalizedString`, and it works — until it doesn't.

I'm the developer behind Engramr — Reminders and Alarms app, an app that currently ships in 14 languages. What started as a straightforward localization setup gradually turned into a engineering problem that Apple's built-in tools simply don't solve.

So I built LocalizationEngine — an open-source Swift Package that handles runtime language switching, OTA translation updates, pluralization, named substitutions, SwiftUI and UIKit support, with zero external dependencies. iOS 16+, Swift 5.9+.

This article is about why it exists and what problems it solves. For integration steps and code examples, check the GitHub repository.

## The Six Problems That Pushed Me to Build This

### 1. Raw Strings Are Silent Landmines

Every iOS developer has written this line:

```swift
label.text = NSLocalizedString("home_reminders_tab", comment: "")
```

Now imagine a typo: `"home_remindrs_tab"`. No compiler error. No runtime crash. The user just sees the raw key on screen, and you won't know until someone reports it — or worse, until it shows up in an App Store screenshot.

Multiply that across 50 screens and hundreds of keys. You're essentially programming with magic strings and hoping for the best.

### 2. No Discoverability

When a new team member joins, how do they find out what localization keys exist? They grep. There's no autocomplete, no single source of truth, no way to browse available strings by feature. It's archaeology, not engineering.

### 3. Language Switching Requires an App Restart

Apple's `Localizable.strings` system resolves bundles at process launch. Want an in-app language picker? You're on your own. The system literally wasn't designed for it.

### 4. Fixing a Typo Means Waiting for App Store Review

You spot a translation error. A single wrong word in Japanese. The fix takes 10 seconds — but shipping it takes days. Your options? Wait for review, or pay $100–500/month for services like Lokalise or Phrase.

### 5. Domain Logic Gets Polluted

Your `Category` model shouldn't know about `NSLocalizedString`. But when a stored category named `"Work"` needs to display as `"Puna"` in Albanian, suddenly your domain layer is importing UIKit concepts. The boundary between storage and display starts leaking.

### 6. You Can't Test What You Can't See

How do you verify that every key has a translation in every supported language? How do you test that your domain localizers produce the right keys? With raw strings, you can't — not meaningfully.

## The Journey: From Wrapper to Architecture

The first version was embarrassingly simple: a wrapper around `NSLocalizedString` that loaded a different `.lproj` bundle based on a `UserDefaults` value. It worked for language switching, but it was fragile.

The real shift happened when I asked: what if invalid keys were impossible?

Not caught at runtime. Not flagged by a linter. Impossible to express in code.

That's when the architecture clicked.

## The Core Idea: Make Invalid Keys Unrepresentable

Instead of scattering string literals across your codebase, you define enums:

```swift
enum CommonKey: String, CaseIterable {
    case cancel, close, delete, done, edit, save, today,
}
```

Try typing `.cancl` — it won't compile. The compiler is now your localization linter, for free.

Each feature area gets its own enum. A developer working on reminders only sees `RemindersKey`. No scrolling through 500 keys. Every key maps to a dot-separated string in your String Catalog: `"common.cancel"`, `"reminders.category_work"`.

At call sites, it looks like this:

```swift
// SwiftUI
Text(L10n.settings.localized)
Button(L10n.done.localized) { ... }

// UIKit
label.text = L10n.settings.localized
cell.textLabel?.text = L10n.profile.localized
```

`.localized` returns a plain `String`. No custom views. No wrappers. It works anywhere a `String` works.

## Live Language Switching — No Restart

This was the feature that started the whole project. The SDK's `LocalizationManager` is an `ObservableObject` with a `@Published bundle` property. When the user switches language:

1. The new selection is persisted
2. The correct `.lproj` bundle is resolved
3. `bundle` publishes the change
4. SwiftUI re-renders every view that reads a localized string

That's it. No notification center plumbing. No manual refresh calls. SwiftUI's reactive pipeline handles the propagation automatically. The entire app updates in a single frame.

For UIKit, the SDK provides `LocalizationObserver` — a closure that fires on the main thread whenever the language changes. Plug it into `viewDidLoad`, update your labels, done.

## OTA: Update Translations Without an App Release

This is the headline feature, and the one that saves real money.

The idea is simple: upload `.strings` files to S3, a CDN, or any URL. The app downloads them on launch, caches to disk, and `NSLocalizedString` resolves from the cached bundle natively. If the download fails, bundled translations are the fallback.

You implement one protocol — `TranslationFetchProviding` — with your preferred networking stack. The SDK handles everything else: versioned disk caching, ETag conditional requests (skip re-download when nothing changed), minimum fetch intervals, parallel prefetch of multiple languages, and atomic writes.

No Lokalise. No Phrase. No Crowdin subscription. Your own S3 bucket and a 20-line fetch provider.

### The Bundle Caching Gotcha Nobody Tells You About

Here's a fun one I discovered the hard way: Apple's `Bundle` class caches internally by file path. If you download a new translation and write it to the same path, `Bundle` happily serves the old cached version.

The SDK solves this by writing each download to a UUID-stamped subdirectory. Every update gets a fresh path, the old directory is cleaned up, and `Bundle` always sees new content. The entire operation is lock-protected to prevent race conditions during concurrent updates.

## What Happens When Things Go Wrong

| Scenario | Behavior |
| --- | --- |
| Server is down | Last downloaded version from disk |
| Never downloaded anything | Bundled `.strings` from Xcode |
| Key missing in active language | Falls back to English automatically |
| No internet on first launch | Bundled translations, OTA retries next launch |

Users never see raw keys. The two-tier resolution — active bundle, then fallback language — guarantees it.

## Pluralization and Named Substitutions

The SDK supports Apple's native `.stringsdict` for plural rules:

```swift
Text(L10n.itemsCount.localized(count: 1))  // "1 item"
Text(L10n.itemsCount.localized(count: 3))  // "3 items"
```

Russian has 3 plural forms. Arabic has 6. You define them once in `.stringsdict`, and the system picks the right variant per locale.

For strings with multiple parameters, named tokens are more readable than positional `%@`:

```swift
// "Hello, %{name}! You have %{count} new messages."
Text(L10n.greeting.localized(substitutions: [
    "name": "Alice", "count": "5"
]))
```

Translators can rearrange `%{name}` and `%{count}` freely — they're order-independent.

## The Architecture: Five Modules, Zero Dependencies

The SDK is a Swift Package split into focused modules with strict dependency direction:

- **LocalizationCore** — The engine: manager, protocols, bundle resolution, language switching. No UI framework dependency.
- **LocalizationSwiftUI** — `LocalizedText` view and `.localizationManager()` environment modifier.
- **LocalizationUIKit** — `LocalizationObserver` for reactive UIKit updates.
- **LocalizationOTA** — Fetch, cache, and resolve OTA translations.
- **LocalizationEngine** — Umbrella module. One `import` gives you everything.

Every component is protocol-driven: bundle provider, storage backend, fetch provider, cache — all swappable. Swap `UserDefaults` for Keychain storage. Replace the main bundle provider with your OTA provider. Inject mocks for testing. The SDK doesn't care.

The package knows nothing about your app's keys. Your app defines its vocabulary through enums. The package just resolves them.

```
Views → Domain → LocalizationEngine → Foundation (nothing else)
```

## 37 Tests That Actually Catch Things

The test suite isn't a checkbox exercise. Here's what it catches:

- Typo in an enum raw value → Catalog sync test fails
- Missing translation for a language → Parameterized language test fails
- OTA cache miss → Integration test verifies bundled fallback
- OTA V1 → V2 update → Integration test proves fresh data is served without restart
- ETag conditional request → Integration test verifies skip on 304
- Pluralization interpolation → Plural resolution test
- Named substitution tokens → Substitution test
- New key added without catalog entry → Catalog sync test catches it

The OTA integration tests use real disk I/O and real `NSLocalizedString` resolution. No mocking the thing you're testing.

## What This Looks Like in Practice

In Engramr, adding a new language is:

1. One enum case in `AppLanguage`
2. Translations in the String Catalog
3. Upload `.strings` to S3 for OTA

That's it. The picker updates automatically (thanks to `CaseIterable`). The resolution chain handles partial translations with English fallbacks. Remote Config can disable a language without an app update.

14 languages. Runtime switching. OTA updates. All from a single `import LocalizationEngine`.

## Honest Downsides

- **UserDefaults for persistence.** Language preference is stored in `UserDefaults`. Works for single-user apps but isn't suitable for multi-profile scenarios.
- **OTA requires hosting.** You need an S3 bucket or CDN, plus a type conforming to `TranslationFetchProviding`. The SDK handles caching and resolution — you handle hosting and networking.
- **Initial setup isn't instant.** Defining type-safe key enums takes more upfront work than throwing `NSLocalizedString` calls everywhere. The payoff is downstream: no typo bugs, full testability, instant discoverability.

## Key Takeaways

> **Make invalid keys unrepresentable.** Enums are the cheapest static analysis you can add.

> **Treat localization as infrastructure.** Put it in a package. Keep it key-agnostic. Let the app define its vocabulary.

> **`@Published` is all you need for live switching.** Publish the bundle, SwiftUI handles the rest.

> **Always have a fallback.** Two-tier resolution means users never see raw keys.

> **OTA doesn't require a SaaS.** A `.strings` file on S3, an ETag header, and a small protocol conformance. The SDK handles the rest.

> **Don't let `NSLocalizedString` leak into your domain.** Bridge stored data through dedicated localizer types that own the mapping.

> **Test behavior, not compilation.** Catalog sync tests catch missing translations. OTA integration tests prove the full pipeline with real I/O.

The SDK is open-source: [LocalizationEngine on GitHub](https://github.com/egzonpllana/localization-engine-ios). The full architecture ships in Engramr — Reminders & Alarms, available on the App Store.
