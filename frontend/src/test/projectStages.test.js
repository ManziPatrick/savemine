import { describe, expect, it } from 'vitest';
import { fileExpenseCategory } from '../utils/fileExpense';
import { repeatsMonthly, stageKind, stagesFor, showsFarmMeasure } from '../utils/projectStages';

describe('project stages', () => {
  it('brings coding stages for a software project', () => {
    expect(stageKind('coding')).toBe('coding');
    expect(stageKind('Software Development', 'B foundation')).toBe('coding');
    expect(stagesFor('coding')).toContain('Testing');
    expect(stagesFor('coding')).toContain('AI subscription');
    expect(stagesFor('coding')).toContain('VPS');
    expect(repeatsMonthly('AI subscription')).toBe(true);
    expect(repeatsMonthly('VPS')).toBe(true);
    expect(repeatsMonthly('Coding')).toBe(false);
  });

  it('brings crop stages for farming and agriculture', () => {
    expect(stageKind('farming')).toBe('farming');
    expect(stageKind('agriculture', 'Maize plantation')).toBe('farming');
    expect(stagesFor('agriculture')).toContain('Maize seed');
    expect(stagesFor('farming')).toContain('NPK');
    expect(stagesFor('farming')).not.toContain('Hens chicks');
  });

  it('brings animal stages for rearing', () => {
    expect(stageKind('rearing')).toBe('rearing');
    expect(stageKind('animal farming', 'Pigs')).toBe('rearing');
    expect(stagesFor('rearing')).toEqual(expect.arrayContaining(['Hens chicks', 'Pigs fattening', 'Cattle']));
  });

  it('keeps every stage name short enough to save', () => {
    const names = [...stagesFor('coding'), ...stagesFor('farming'), ...stagesFor('rearing')];
    expect(names.every((name) => name.length >= 2 && name.length <= 40)).toBe(true);
  });

  it('files each stage on the matching expense category', () => {
    expect(fileExpenseCategory('Maize seed')).toEqual({ category: 'agriculture', subcategory: 'Maize seed' });
    expect(fileExpenseCategory('Hens feeding')).toEqual({ category: 'animal_care', subcategory: 'Hens feeding' });
    expect(fileExpenseCategory('Testing')).toEqual({ category: 'business', subcategory: 'Testing' });
    expect(fileExpenseCategory('School fees')).toEqual({ category: 'school', subcategory: '' });
  });

  it('asks for a farm measure on farming and rearing, not on coding', () => {
    expect(showsFarmMeasure('', 'farming', 'Maize')).toBe(true);
    expect(showsFarmMeasure('', 'rearing', 'Hens')).toBe(true);
    expect(showsFarmMeasure('Planning', 'coding', 'App')).toBe(false);
    expect(showsFarmMeasure('Maize seed', 'general', 'House build')).toBe(true);
  });
});
