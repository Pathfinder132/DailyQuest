/**
 * Merge user-facing profile fields independently instead of trusting a single profile-wide
 * timestamp. A newer explicit field timestamp wins over an older one; an explicitly edited
 * value wins over an unversioned legacy copy. Global updatedAt is only a fallback for fields
 * that have no per-field timestamp metadata.
 */
function timestampValue(value) {
  if (Number.isFinite(value)) return Number(value);
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  if (value && Number.isFinite(value.seconds)) return Number(value.seconds) * 1000;
  return 0;
}

const META_KEYS = new Set(['fieldUpdatedAt', 'fieldTimestampedFields', 'updatedAt']);

export function mergeProfilesByFieldTimestamp(...profiles) {
  const candidates = profiles.filter((profile) => profile && typeof profile === 'object' && !Array.isArray(profile));
  const result = {};
  const fieldUpdatedAt = {};
  const explicitFields = new Set();
  const keys = new Set(candidates.flatMap((profile) => Object.keys(profile).filter((key) => !META_KEYS.has(key))));
  let latestUpdatedAt = 0;

  const isExplicit = (profile, key) => {
    if (Array.isArray(profile.fieldTimestampedFields)) return profile.fieldTimestampedFields.includes(key);
    // Older releases occasionally emitted zero-valued placeholder timestamps for every
    // field. Those placeholders are not evidence that the user explicitly edited the field.
    return timestampValue(profile.fieldUpdatedAt?.[key]) > 0;
  };
  const stampFor = (profile, key) => {
    const fieldStamp = timestampValue(profile.fieldUpdatedAt?.[key]);
    return fieldStamp > 0 ? fieldStamp : timestampValue(profile.updatedAt);
  };

  for (const profile of candidates) latestUpdatedAt = Math.max(latestUpdatedAt, timestampValue(profile.updatedAt));
  for (const key of keys) {
    const fieldCandidates = candidates.filter((profile) => Object.prototype.hasOwnProperty.call(profile, key) && profile[key] !== undefined);
    if (!fieldCandidates.length) continue;

    const explicitCandidates = fieldCandidates.filter((profile) => isExplicit(profile, key));
    const sourcePool = explicitCandidates.length ? explicitCandidates : fieldCandidates;
    let winner = sourcePool[0];
    for (const candidate of sourcePool.slice(1)) {
      if (stampFor(candidate, key) >= stampFor(winner, key)) winner = candidate;
    }

    result[key] = winner[key];
    const hasDirectStamp = Object.prototype.hasOwnProperty.call(winner.fieldUpdatedAt || {}, key);
    const hasGlobalStamp = timestampValue(winner.updatedAt) > 0;
    const explicit = isExplicit(winner, key);
    if (hasDirectStamp || hasGlobalStamp || explicit) fieldUpdatedAt[key] = stampFor(winner, key);
    if (explicit) explicitFields.add(key);
  }

  if (Object.keys(fieldUpdatedAt).length) result.fieldUpdatedAt = fieldUpdatedAt;
  const hasTimestampMetadata = candidates.some((profile) =>
    Object.prototype.hasOwnProperty.call(profile, 'updatedAt')
    || Object.prototype.hasOwnProperty.call(profile, 'fieldUpdatedAt')
    || Array.isArray(profile.fieldTimestampedFields),
  );
  if (hasTimestampMetadata) result.fieldTimestampedFields = [...explicitFields].sort();
  if (latestUpdatedAt > 0) result.updatedAt = latestUpdatedAt;
  return result;
}
