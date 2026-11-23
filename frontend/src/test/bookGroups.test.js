import { describe, expect, it } from 'vitest';
import { groupBook, linesFromBooks } from '../utils/bookGroups';

const projects = [{
  _id: 'house',
  name: 'House',
  expenses: [{ category: 'school', amount: 50000, reason: 'Fees' }, { category: 'tax', amount: 10000, reason: 'Land tax' }],
  incomes: [{ category: 'salary', amount: 80000, title: 'Site pay' }, { category: 'income', amount: 20000, title: 'Sale' }],
}];

const expenses = [
  { category: 'insurance', amount: 15000, title: 'Cover', projectId: null },
  { category: 'education', amount: 5000, title: 'Books' },
];

describe('groupBook', () => {
  const lines = linesFromBooks({ projects, expenses });

  it('groups project and general records by category', () => {
    const result = groupBook(lines);
    const school = result.groups.find((group) => group.category === 'school');
    expect(school.out).toBe(55000);
    expect(result.income).toBe(100000);
    expect(result.spent).toBe(80000);
    expect(result.net).toBe(20000);
  });

  it('can look at general records or one project', () => {
    expect(groupBook(lines, { scope: 'general' }).spent).toBe(20000);
    expect(groupBook(lines, { projectId: 'house', category: 'salary' }).income).toBe(80000);
    expect(groupBook(lines, { projectId: 'house', category: 'salary' }).count).toBe(1);
  });
});