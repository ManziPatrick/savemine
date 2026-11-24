import { FARM_STAGES } from './farmStages';
import { looksLikeFarming } from './farmMeasure';

export const CODING_STAGES = [
  'Planning',
  'Requirements',
  'Design',
  'Coding',
  'Frontend',
  'Backend',
  'Database',
  'Testing',
  'Bug fixing',
  'Deployment',
  'Web hosting',
  'Domain name',
  'AI subscription',
  'VPS',
  'Dev tools',
  'Maintenance',
];

export const ANIMAL_STAGES = [
  'Animal housing',
  'Feeding',
  'Water',
  'Vaccination',
  'Treatment',
  'Breeding',
  'Hens chicks',
  'Hens brooding',
  'Hens feeding',
  'Hens vaccination',
  'Hens layers',
  'Hens eggs',
  'Hens sale',
  'Pigs piglets',
  'Pigs weaning',
  'Pigs feeding',
  'Pigs vaccination',
  'Pigs fattening',
  'Pigs sale',
  'Cattle',
  'Goats',
  'Sheep',
  'Rabbits',
  'Fish',
];

export { FARM_STAGES };

export function repeatsMonthly(stage) {
  return /subscription|\bvps\b|hosting/i.test(String(stage || ''));
}

export function stageKind(projectType, projectName) {
  const text = `${projectType || ''} ${projectName || ''}`.toLowerCase();
  if (/rear|livestock|poultry|animal|hen|pig|cattle|goat|sheep|rabbit|fish/.test(text)) return 'rearing';
  if (/cod(e|ing)|software|develop|program|\bapp\b|website/.test(text)) return 'coding';
  if (/farm|agricultur|crop|maize|garden/.test(text)) return 'farming';
  return '';
}

export function stagesFor(projectType, projectName) {
  const kind = stageKind(projectType, projectName);
  if (kind === 'coding') return CODING_STAGES;
  if (kind === 'rearing') return ANIMAL_STAGES;
  if (kind === 'farming') return FARM_STAGES;
  return [];
}

export function showsFarmMeasure(category, projectType, projectName) {
  const kind = stageKind(projectType, projectName);
  if (kind === 'coding') return looksLikeFarming(category);
  if (kind === 'farming' || kind === 'rearing') return true;
  return looksLikeFarming(category, projectType, projectName);
}

export function stageHint(kind) {
  if (kind === 'coding') {
    return 'Planning, design, coding, testing, hosting, an AI subscription, and a VPS. The subscription and VPS repeat every month. If a stage is missing, create it. The amount is the price on this project.';
  }
  if (kind === 'rearing') {
    return 'Hens, pigs, cattle, goats, feeding, and vaccination. If a stage is missing, create it. The amount is the price on this project.';
  }
  if (kind === 'farming') {
    return 'Seeds such as maize, beans, sorghum, or rice, plus NPK. If a stage is missing, create it. The amount is the price on this project.';
  }
  return 'Search a category, or create one. The amount is the price on this project.';
}
