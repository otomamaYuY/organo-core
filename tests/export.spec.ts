import { test, expect, type Download } from '@playwright/test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function openExportModal(page: Parameters<Parameters<typeof test>[1]>[0]) {
  await page.addInitScript(() => {
      localStorage.removeItem('organo-core-data')
      localStorage.setItem('organo-tour-completed', 'true')
    })
  await page.goto('/')
  // Wait for the app to finish its initial render before interacting
  await page.waitForSelector('.react-flow__node', { timeout: 10000 })
  await page.getByTestId('btn-export').click()
  await expect(page.getByTestId('export-modal')).toBeVisible()
}

async function reopenExportModal(page: Parameters<Parameters<typeof test>[1]>[0]) {
  // The modal auto-closes after every export action. Re-open it.
  await page.getByTestId('btn-export').click()
  await expect(page.getByTestId('export-modal')).toBeVisible()
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Export / Download functionality', () => {
  // ── JSON (flat) ──────────────────────────────────────────────────────────

  test('export as JSON triggers download with .json extension', async ({ page }) => {
    await openExportModal(page)

    // Register download listener BEFORE clicking the export button
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('export-json').click()
    const download: Download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/\.json$/)

    // Modal should have closed automatically
    await expect(page.getByTestId('export-modal')).not.toBeVisible()
  })

  // ── JSON Tree ────────────────────────────────────────────────────────────

  test('export as JSON Tree triggers download with .json extension', async ({ page }) => {
    await openExportModal(page)

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('export-json-tree').click()
    const download: Download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/\.json$/)
    await expect(page.getByTestId('export-modal')).not.toBeVisible()
  })

  // ── CSV ──────────────────────────────────────────────────────────────────

  test('export as CSV triggers download with .csv extension', async ({ page }) => {
    await openExportModal(page)

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('export-csv').click()
    const download: Download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/\.csv$/)
    await expect(page.getByTestId('export-modal')).not.toBeVisible()
  })

  // ── HTML ─────────────────────────────────────────────────────────────────

  test('export as HTML triggers download with .html extension', async ({ page }) => {
    await openExportModal(page)

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('export-html').click()
    const download: Download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/\.html$/)
    await expect(page.getByTestId('export-modal')).not.toBeVisible()
  })

  // ── PNG ──────────────────────────────────────────────────────────────────
  // html-to-image renders the canvas asynchronously; allow a longer timeout.

  test('export as PNG triggers download with .png extension', async ({ page }) => {
    await openExportModal(page)

    // PNG generation via html-to-image can take a few seconds
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
    await page.getByTestId('export-png').click()
    const download: Download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/\.png$/)
    await expect(page.getByTestId('export-modal')).not.toBeVisible()
  })

  // ── SVG ──────────────────────────────────────────────────────────────────

  test('export as SVG triggers download with .svg extension', async ({ page }) => {
    await openExportModal(page)

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
    await page.getByTestId('export-svg').click()
    const download: Download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/\.svg$/)
    await expect(page.getByTestId('export-modal')).not.toBeVisible()
  })

  // ── PDF ──────────────────────────────────────────────────────────────────
  // jsPDF.save() internally creates a blob URL and clicks an anchor — the
  // browser still fires a download event that Playwright can intercept.

  test('export as PDF triggers download with .pdf extension', async ({ page }) => {
    await openExportModal(page)

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
    await page.getByTestId('export-pdf').click()
    const download: Download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
    await expect(page.getByTestId('export-modal')).not.toBeVisible()
  })

  // ── Modal re-opens correctly between exports ─────────────────────────────

  test('modal can be re-opened after a prior export', async ({ page }) => {
    await openExportModal(page)

    // Perform one export (JSON — fastest, no async canvas rendering)
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('export-json').click()
    await downloadPromise

    // Modal should be gone; re-open and verify
    await expect(page.getByTestId('export-modal')).not.toBeVisible()
    await reopenExportModal(page)

    // All format buttons should still be present
    for (const testId of [
      'export-json',
      'export-json-tree',
      'export-csv',
      'export-html',
      'export-png',
      'export-svg',
      'export-pdf',
    ]) {
      await expect(page.getByTestId(testId)).toBeVisible()
    }
  })

  // ── Modal closes when clicking the backdrop ──────────────────────────────

  test('modal closes when clicking the backdrop overlay', async ({ page }) => {
    await openExportModal(page)

    // The backdrop is the fixed overlay that wraps the modal panel.
    // Click at the very top-left corner (outside the centered 360px panel).
    await page.mouse.click(5, 5)
    await expect(page.getByTestId('export-modal')).not.toBeVisible()
  })
})
