import Fuse from 'fuse.js';

// Find similar items using fuzzy search
export function findSimilarItems(newTitle, existingTodos, threshold = 0.4) {
  if (!newTitle || newTitle.length < 3 || !existingTodos.length) {
    return [];
  }

  const fuse = new Fuse(existingTodos, {
    keys: ['title'],
    threshold: threshold, // Lower = more strict matching
    includeScore: true,
  });

  const results = fuse.search(newTitle);

  // Filter to only return items with good enough match
  return results
    .filter(result => result.score < threshold)
    .map(result => ({
      item: result.item,
      score: 1 - result.score, // Convert to similarity percentage
    }))
    .slice(0, 3); // Return top 3 matches
}

// Calculate similarity between two strings (Levenshtein-based)
export function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  // Simple word overlap for quick similarity check
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));

  let overlap = 0;
  for (const word of words1) {
    if (words2.has(word)) overlap++;
  }

  const totalWords = words1.size + words2.size - overlap;
  return totalWords > 0 ? overlap / totalWords : 0;
}
