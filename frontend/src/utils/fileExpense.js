import { looksLikeFarming } from './farmMeasure';
import { ANIMAL_STAGES, CODING_STAGES, FARM_STAGES } from './projectStages';

const FARM_KEYS = new Set(FARM_STAGES.map((name) => name.toLowerCase()));
const ANIMAL_KEYS = new Set(ANIMAL_STAGES.map((name) => name.toLowerCase()));
const CODING_KEYS = new Set(CODING_STAGES.map((name) => name.toLowerCase()));

const EXPENSE_KEYS = {
  'school fees': 'school',
  school: 'school',
  education: 'education',
  home: 'housing',
  housing: 'housing',
  'housing & rent': 'housing',
  tax: 'tax',
  salary: 'salary',
  insurance: 'insurance',
  investment: 'investment',
  loan: 'loan',
  food: 'food',
  'food & dining': 'food',
  transport: 'transport',
  transportation: 'transport',
  utilities: 'utilities',
  healthcare: 'healthcare',
  entertainment: 'entertainment',
  clothing: 'clothing',
  'personal care': 'personal_care',
  business: 'business',
  'animal care': 'animal_care',
  agriculture: 'agriculture',
  farming: 'agriculture',
  farm: 'agriculture',
  emergency: 'emergency',
  gift: 'gift',
  gifts: 'gift',
  donation: 'donation',
  donations: 'donation',
  other: 'other',
};

export function fileExpenseCategory(name, subcategory) {
  const raw = String(name || '').trim();
  const folded = raw.toLowerCase();
  const key = EXPENSE_KEYS[folded];
  if (ANIMAL_KEYS.has(folded) || (!key && /rear|poultry|hen|pig|cattle|goat|sheep|rabbit|fish/.test(folded))) {
    return { category: 'animal_care', subcategory: subcategory || raw };
  }
  if (CODING_KEYS.has(folded)) {
    return { category: 'business', subcategory: subcategory || raw };
  }
  if (FARM_KEYS.has(folded) || (!key && looksLikeFarming(raw))) {
    return { category: 'agriculture', subcategory: subcategory || raw };
  }
  if (key) return { category: key, subcategory: subcategory || '' };
  return { category: 'other', subcategory: raw || subcategory || '' };
}
