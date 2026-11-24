export function looksLikeFarming(...parts) {
  return /farm|agricultur|seed|maize|bean|sorghum|rice|wheat|soya|soybean|groundnut|cassava|potato|banana|tomato|cabbage|onion|coffee|nursery|sowing|transplant|manure|npk|urea|compost|\bdap\b|lime|hen|pig|planting|harvest|weed|fatten|brooding|piglet|irrigat/.test(
    parts.filter(Boolean).join(' ').toLowerCase()
  );
}

export function farmFromForm(form) {
  const kilograms = Number(form.kilograms);
  const size = Number(form.farmSize);
  const days = Number(form.farmDays);
  const sizeUnit = String(form.farmSizeUnit || '').trim();
  const level = String(form.farmLevel || '').trim();
  const farm = {};
  if (kilograms > 0) farm.kilograms = kilograms;
  if (size > 0) farm.size = size;
  if (sizeUnit) farm.sizeUnit = sizeUnit;
  if (days > 0) farm.days = days;
  if (level) farm.level = level;
  return Object.keys(farm).length ? farm : undefined;
}

export function businessPlanText(projects = []) {
  const lines = ['SaveMine business plan'];
  projects.forEach((project) => {
    const usage = project.linkedExpenses || [];
    const price = usage.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const count = usage.length;
    lines.push(`${project.name}: ${count} ${count === 1 ? 'use' : 'uses'}, ${price} FRW`);
    usage.slice(0, 8).forEach((row) => {
      const stage = row.subcategory || row.title || row.category || 'Usage';
      const measure = farmSummary(row.farm);
      lines.push(`- ${stage}: ${row.amount} FRW${measure ? ` (${measure})` : ''}`);
    });
  });
  const text = lines.join('. ');
  return text.length > 480 ? `${text.slice(0, 477)}...` : text;
}

export function farmSummary(farm) {
  if (!farm) return '';
  const bits = [];
  if (farm.kilograms) bits.push(`${farm.kilograms} kg`);
  if (farm.size) bits.push(`${farm.size}${farm.sizeUnit ? ` ${farm.sizeUnit}` : ''}`);
  if (farm.days) bits.push(`${farm.days} days`);
  if (farm.level) bits.push(farm.level);
  return bits.join(' · ');
}
