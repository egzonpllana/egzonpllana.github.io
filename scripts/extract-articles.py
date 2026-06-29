#!/usr/bin/env python3
"""Extract cover image + raw text from Medium PDF exports.

Covers -> public/articles/covers/<slug>.<ext>
Raw text -> <scratch>/<slug>.txt  (for faithful markdown transcription)
"""
import os
import sys
import json
import fitz  # PyMuPDF

SRC = "/Users/egzonpllana/Downloads/medium-articles"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COVERS = os.path.join(ROOT, "public", "articles", "covers")
SCRATCH = sys.argv[1] if len(sys.argv) > 1 else "/tmp/article-text"

# filename substring -> slug
SLUGS = {
    "NSLocalizedString": "six-problems-with-nslocalizedstring",
    "Networking Layer in Swift 6 with Interceptors": "thread-safe-networking-layer-swift-6-interceptors",
    "Airbnb Host Passport": "airbnb-host-passport-view-swift",
    "Gauge View": "drawing-a-gauge-view-swift",
    "EventHorizon": "eventhorizon-thread-safe-networking-swift",
    "1,000 Unit Tests": "from-0-to-1000-unit-tests-di-framework",
    "Cached Harmony": "from-network-chaos-to-cached-harmony",
    "Offline Photo Geocoding": "offline-photo-geocoding-engine",
    "Silent Memory Leak": "stopping-a-silent-memory-leak-ios",
    "App Attest": "apple-app-attest-ios-api-security",
    "RunLoop.main and DispatchQueue.main": "runloop-main-vs-dispatchqueue-main",
    "Understanding Concurrency in Swift 6": "understanding-concurrency-swift-6-sendable-mainactor",
}

os.makedirs(COVERS, exist_ok=True)
os.makedirs(SCRATCH, exist_ok=True)


def slug_for(name):
    for key, slug in SLUGS.items():
        if key in name:
            return slug
    return None


def extract_cover(doc, slug):
    """Pick the topmost reasonably large image across the first 3 pages."""
    candidates = []
    for pno in range(min(3, doc.page_count)):
        page = doc[pno]
        for img in page.get_images(full=True):
            xref = img[0]
            try:
                rects = page.get_image_rects(xref)
            except Exception:
                rects = []
            bbox = rects[0] if rects else None
            try:
                pix = fitz.Pixmap(doc, xref)
                w, h = pix.width, pix.height
            except Exception:
                continue
            # skip tiny avatars / icons / logos
            if w < 360 or h < 160:
                continue
            # skip extreme aspect ratios (separators)
            ar = w / h if h else 0
            if ar < 0.4 or ar > 6:
                continue
            y = bbox.y0 if bbox else 9999
            candidates.append((pno, y, w * h, xref, pix))
    if not candidates:
        return None
    # earliest page, then topmost position
    candidates.sort(key=lambda c: (c[0], c[1]))
    _, _, _, xref, pix = candidates[0]
    if pix.n - pix.alpha >= 4:  # CMYK -> RGB
        pix = fitz.Pixmap(fitz.csRGB, pix)
    out = os.path.join(COVERS, f"{slug}.png")
    pix.save(out)
    return out


summary = []
for fn in sorted(os.listdir(SRC)):
    if not fn.lower().endswith(".pdf"):
        continue
    slug = slug_for(fn)
    if not slug:
        print(f"!! no slug mapping for: {fn}")
        continue
    path = os.path.join(SRC, fn)
    doc = fitz.open(path)
    # raw text
    text = "\n".join(doc[p].get_text("text") for p in range(doc.page_count))
    with open(os.path.join(SCRATCH, f"{slug}.txt"), "w") as f:
        f.write(text)
    cover = extract_cover(doc, slug)
    summary.append({
        "slug": slug,
        "file": fn,
        "pages": doc.page_count,
        "cover": os.path.basename(cover) if cover else None,
        "text_chars": len(text),
    })
    doc.close()
    print(f"[ok] {slug}: pages={summary[-1]['pages']} cover={summary[-1]['cover']} chars={len(text)}")

with open(os.path.join(SCRATCH, "_summary.json"), "w") as f:
    json.dump(summary, f, indent=2)
print(f"\nWrote {len(summary)} articles. Covers -> {COVERS}")
