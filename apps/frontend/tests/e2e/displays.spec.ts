/**
 * Displays Page E2E Tests
 * Basic end-to-end tests for displays page
 */

import { test, expect } from '@playwright/test';

test.describe('Displays Page', () => {
  test('should navigate to displays page', async ({ page }) => {
    await page.goto('/displays');

    // Should show page heading
    await expect(page.getByRole('heading', { name: 'Displays' })).toBeVisible();
  });

  test('should display page description', async ({ page }) => {
    await page.goto('/displays');

    // Should show page description
    await expect(
      page.getByText('Manage your digital signage displays')
    ).toBeVisible();
  });

  test('should show "Add Display" button', async ({ page }) => {
    await page.goto('/displays');

    // Should have Add Display button
    const addButton = page.getByRole('button', { name: /Add Display/i });
    await expect(addButton).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    await page.goto('/displays');

    // Should show stats cards
    await expect(page.getByText('Total Displays')).toBeVisible();
    await expect(page.getByText('Online')).toBeVisible();
    await expect(page.getByText('Offline')).toBeVisible();
    await expect(page.getByText('Error')).toBeVisible();
  });

  test('should show empty state or displays list', async ({ page }) => {
    await page.goto('/displays');

    // Should either show empty state or displays list
    const emptyState = page.getByText('No displays yet');
    const displaysList = page.getByText(/All Displays/i);

    // At least one should be visible
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const hasDisplaysList = await displaysList.isVisible().catch(() => false);

    expect(hasEmptyState || hasDisplaysList).toBeTruthy();
  });

  test('should show real-time connection indicator when displays exist', async ({ page }) => {
    await page.goto('/displays');

    // Check if we have displays
    const displaysList = page.getByText(/All Displays \(\d+\)/);
    const hasDisplays = await displaysList.isVisible().catch(() => false);

    if (hasDisplays) {
      // Should show real-time updates indicator
      await expect(
        page.getByText('Real-time updates active')
      ).toBeVisible();
    }
  });

  test('should handle error state gracefully', async ({ page }) => {
    // Navigate to displays page
    await page.goto('/displays');

    // Page should load even if there's an error
    await expect(page.getByRole('heading', { name: 'Displays' })).toBeVisible();

    // Check if error message is shown (it might be)
    const errorCard = page.getByText('Failed to load displays');
    const hasError = await errorCard.isVisible().catch(() => false);

    // If error is shown, it should have a helpful message
    if (hasError) {
      await expect(
        page.getByText('Make sure the backend is running')
      ).toBeVisible();
    }
  });
});
