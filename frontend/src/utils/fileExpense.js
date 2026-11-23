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
  emergency: 'emergency',
  gift: 'gift',
  gifts: 'gift',
  donation: 'donation',
  donations: 'donation',
  other: 'other',
};

export function fileExpenseCategory(name, subcategory) {
  const key = EXPENSE_KEYS[String(name || '').trim().toLowerCase()];
  if (key) return { category: key, subcategory: subcategory || '' };
  return { category: 'other', subcategory: String(name || '').trim() || subcategory || '' };
}
