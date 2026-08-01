import { createElement } from 'react';

/**
 * Render a string with **bold** markers into React elements.
 * Used by the Assistant page and the floating chat widget.
 */
export function renderBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? createElement('strong', { key: i, className: 'font-semibold text-gray-900' }, part.slice(2, -2))
      : createElement('span', { key: i }, part)
  );
}
