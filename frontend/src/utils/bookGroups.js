export const categoryLabels = {
  school: 'School',
  education: 'School',
  tax: 'Tax',
  salary: 'Salary',
  insurance: 'Insurance',
  investment: 'Investment',
  loan: 'Loan',
  income: 'Income',
  materials: 'Materials',
  labor: 'Labor',
  transport: 'Transport',
  rent: 'Rent',
  utilities: 'Utilities',
  food: 'Food',
  housing: 'Housing',
  healthcare: 'Healthcare',
  other: 'Other',
};

export const expenseChoices = [
  'school', 'tax', 'salary', 'insurance', 'investment', 'loan',
  'materials', 'labor', 'transport', 'rent', 'utilities', 'food', 'housing', 'healthcare', 'other',
];

export const incomeChoices = ['income', 'salary', 'investment', 'loan'];

export function categoryLabel(id) {
  return categoryLabels[id] || id || 'Other';
}

export function linesFromBooks({ projects = [], expenses = [] } = {}) {
  const lines = [];
  projects.forEach((project) => {
    (project.expenses || []).forEach((expense) => {
      lines.push({
        category: expense.category || 'other',
        amount: Number(expense.amount) || 0,
        flow: 'out',
        scope: 'project',
        projectId: String(project._id || ''),
        label: expense.reason || '',
      });
    });
    (project.incomes || []).forEach((income) => {
      lines.push({
        category: income.category || 'income',
        amount: Number(income.amount) || 0,
        flow: 'in',
        scope: 'project',
        projectId: String(project._id || ''),
        label: income.title || '',
      });
    });
  });
  expenses.forEach((expense) => {
    const projectId = expense.projectId ? String(expense.projectId) : '';
    lines.push({
      category: expense.category === 'education' ? 'school' : (expense.category || 'other'),
      amount: Number(expense.amount) || 0,
      flow: 'out',
      scope: projectId ? 'project' : 'general',
      projectId,
      label: expense.title || '',
    });
  });
  return lines;
}

export function groupBook(lines, { scope = 'all', projectId = '', category = '' } = {}) {
  const selected = lines.filter((line) => {
    if (category && line.category !== category) return false;
    if (scope === 'general' && line.scope !== 'general') return false;
    if (scope === 'project' && line.scope !== 'project') return false;
    if (projectId && line.projectId !== projectId) return false;
    return true;
  });

  const buckets = new Map();
  selected.forEach((line) => {
    const key = line.category || 'other';
    if (!buckets.has(key)) buckets.set(key, { category: key, label: categoryLabel(key), in: 0, out: 0, count: 0 });
    const bucket = buckets.get(key);
    bucket.count += 1;
    if (line.flow === 'in') bucket.in += line.amount;
    else bucket.out += line.amount;
  });

  const groups = [...buckets.values()].sort((a, b) => (b.in + b.out) - (a.in + a.out));
  const income = groups.reduce((sum, group) => sum + group.in, 0);
  const spent = groups.reduce((sum, group) => sum + group.out, 0);
  return { groups, income, spent, net: income - spent, count: selected.length };
}
