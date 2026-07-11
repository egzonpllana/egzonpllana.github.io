/** Clean article slug from a content entry id (strips any .md/.mdx extension). */
export function articleSlug(id: string): string {
  return id.replace(/\.(md|mdx)$/i, '');
}

/** URL-safe slug for a tag, e.g. "Swift 6" → "swift-6". */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
