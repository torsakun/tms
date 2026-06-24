// Parse @mentions out of a comment body and resolve them to user IDs.
//
// A mention is an "@" followed by an email local-part or a (space-collapsed)
// display name, e.g. "@supat.t" or "@Supat". Matching is case-insensitive.

export interface MentionUser {
  id: string;
  name: string | null;
  email: string;
}

export function extractMentionedUserIds(
  body: string,
  users: MentionUser[],
): string[] {
  if (!body) return [];
  const tokens = new Set(
    (body.match(/@([A-Za-z0-9._-]+)/g) || []).map((t) =>
      t.slice(1).toLowerCase(),
    ),
  );
  if (tokens.size === 0) return [];

  const matched = new Set<string>();
  for (const u of users) {
    const localPart = u.email.split("@")[0].toLowerCase();
    const nameKey = (u.name || "").toLowerCase().replace(/\s+/g, "");
    for (const tok of tokens) {
      if (localPart === tok || (nameKey && nameKey.startsWith(tok))) {
        matched.add(u.id);
        break;
      }
    }
  }
  return Array.from(matched);
}
