export function assetUrl(path, base = import.meta.env.BASE_URL) {
  if (!path) return null;
  return `${base}${path}`;
}

export function normalizeEmailAddress(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+at\s+/gi, '@').replace(/\s+dot\s+/gi, '.') : value;
}

export function byDisplayOrder(items) {
  return [...items].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.id.localeCompare(b.id));
}

export function groupPublications(items) {
  const years = [...new Set(items.map((item) => item.year))].sort((a, b) => b - a);
  return years.map((year) => ({ year, items: byDisplayOrder(items.filter((item) => item.year === year)) }));
}

export function sortNews(items) {
  return [...items].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`));
}
