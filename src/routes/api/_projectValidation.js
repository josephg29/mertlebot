const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_SKILLS = new Set(['MONKEY', 'NOVICE', 'BUILDER', 'HACKER', 'EXPERT']);

export function isValidUUID(v) {
  return typeof v === 'string' && UUID_RE.test(v);
}

export function validateProjectData(body) {
  const { title, prompt, skill, guide, chat_html, tags, folder_id } = body;

  if (title !== undefined && (typeof title !== 'string' || title.length > 200)) {
    return 'Title must be 200 characters or fewer';
  }
  if (prompt !== undefined && (typeof prompt !== 'string' || prompt.length > 4000)) {
    return 'Prompt must be 4000 characters or fewer';
  }
  if (skill !== undefined && !VALID_SKILLS.has(skill)) {
    return 'Invalid skill level';
  }
  if (guide !== undefined && (typeof guide !== 'string' || guide.length > 100_000)) {
    return 'Guide is too large';
  }
  if (chat_html !== undefined && (typeof chat_html !== 'string' || chat_html.length > 50_000)) {
    return 'Chat log is too large';
  }
  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.length > 10 || tags.some(t => typeof t !== 'string' || t.length > 30)) {
      return 'Tags must be an array of up to 10 strings (max 30 chars each)';
    }
  }
  if (folder_id !== undefined && folder_id !== null && !isValidUUID(folder_id)) {
    return 'Invalid folder_id';
  }
  return null;
}
