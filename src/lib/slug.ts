/** Clean article slug from a content entry id (strips any .md/.mdx extension). */
export function articleSlug(id: string): string {
  return id.replace(/\.(md|mdx)$/i, '');
}
