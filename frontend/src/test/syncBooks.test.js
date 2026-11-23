import { QueryClient } from 'react-query';
import { describe, expect, it } from 'vitest';
import { syncBooks } from '../utils/syncBooks';

describe('syncBooks', () => {
  it('marks the list and the home-screen totals stale together', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['savings', 'all'], [{ name: 'MoMo' }]);
    queryClient.setQueryData('savingsStats', { total: 15000 });
    queryClient.setQueryData('billReminders', [{ title: 'Rent' }]);

    await syncBooks(queryClient, 'savings');

    expect(queryClient.getQueryState(['savings', 'all']).isInvalidated).toBe(true);
    expect(queryClient.getQueryState('savingsStats').isInvalidated).toBe(true);
    expect(queryClient.getQueryState('billReminders').isInvalidated).toBe(false);
  });

  it('connects a removed contact to the loan lists that show that person', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['contacts', 'all'], []);
    queryClient.setQueryData(['loans', 'active'], []);
    queryClient.setQueryData('loanStats', {});

    await syncBooks(queryClient, 'contacts');

    expect(queryClient.getQueryState(['contacts', 'all']).isInvalidated).toBe(true);
    expect(queryClient.getQueryState(['loans', 'active']).isInvalidated).toBe(true);
    expect(queryClient.getQueryState('loanStats').isInvalidated).toBe(true);
  });
});
