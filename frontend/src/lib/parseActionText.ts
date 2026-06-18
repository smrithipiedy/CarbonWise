/** Parses AI action strings into heading, status badge, and detail text. */
export function parseActionText(action: string) {
  const emojiRegex = /^\s*([\uD800-\uDBFF][\uDC00-\uDFFF]|\S)\s*/;
  const matchEmoji = action.match(emojiRegex);
  const emoji = matchEmoji ? matchEmoji[1] : '';
  const cleanAction = action.replace(emojiRegex, '').trim();

  const colonIdx = cleanAction.indexOf(':');
  let heading = cleanAction;
  let rest = '';

  if (colonIdx !== -1) {
    heading = cleanAction.substring(0, colonIdx).trim();
    rest = cleanAction.substring(colonIdx + 1).trim();
  }

  const statusMatch = rest.match(/\((Good|Moderate|Bad)\)/i);
  const status = statusMatch ? statusMatch[1] : 'Moderate';
  const details = rest.replace(/\((Good|Moderate|Bad)\)/i, '').replace(/\s+/g, ' ').trim();

  return {
    heading: emoji ? `${emoji} ${heading}` : heading,
    status: status.charAt(0).toUpperCase() + status.slice(1),
    details,
  };
}
