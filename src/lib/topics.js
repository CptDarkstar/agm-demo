// Topics are stored as "Topic 1", "Topic 2", … but Firestore returns doc IDs in
// string order ("Topic 1", "Topic 10", "Topic 2"), so sort by the number instead.
export function topicNumber(topicId) {
  const n = parseInt(String(topicId).split(" ")[1], 10);
  return Number.isNaN(n) ? Infinity : n;
}

// Next free ID, by the highest NUMBER (not string order — "Topic 9" sorts after
// "Topic 10" as text, which used to make new topics overwrite existing ones).
export function nextTopicId(ids) {
  const highest = ids
    .map(topicNumber)
    .filter(Number.isFinite)
    .reduce((max, n) => Math.max(max, n), 0);
  return `Topic ${highest + 1}`;
}

export function sortTopicIds(ids) {
  return [...ids].sort(
    (a, b) => topicNumber(a) - topicNumber(b) || a.localeCompare(b)
  );
}
