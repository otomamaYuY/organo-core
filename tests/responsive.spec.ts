import { test, expect } from '@playwright/test'

test.describe('Responsive - Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('organo-core-data')
      localStorage.setItem('organo-tour-completed', 'true')
    })
  })

  test('app loads on mobile viewport', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('app-root')).toBeVisible()
    await expect(page.locator('.react-flow')).toBeVisible()
  })

  test('canvas has non-zero dimensions', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('react-flow-canvas')
    const box = await canvas.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.height).toBeGreaterThan(0)
  })

  test('canvas fills available width on mobile', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('react-flow-canvas')
    const box = await canvas.boundingBox()
    expect(box).toBeTruthy()
    // Canvas should span (nearly) the full viewport width on mobile
    expect(box!.width).toBeGreaterThanOrEqual(370)
  })

  test('nodes are visible on mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow__node', { timeout: 10000 })
    const nodes = page.locator('.react-flow__node')
    const count = await nodes.count()
    expect(count).toBeGreaterThan(0)
  })

  test('all 4 initial nodes are present on mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow__node', { timeout: 10000 })
    const nodes = page.locator('.react-flow__node')
    await expect(nodes).toHaveCount(4)
  })

  test('app-root fills 100vh on mobile', async ({ page }) => {
    await page.goto('/')
    const root = page.getByTestId('app-root')
    const box = await root.boundingBox()
    expect(box).toBeTruthy()
    // Should fill the full viewport height (812px)
    expect(box!.height).toBe(812)
  })
})

test.describe('Responsive - Tablet Viewport', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('organo-core-data')
      localStorage.setItem('organo-tour-completed', 'true')
    })
  })

  test('app loads on tablet viewport', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('app-root')).toBeVisible()
    await expect(page.locator('.react-flow')).toBeVisible()
  })

  test('canvas has non-zero dimensions on tablet', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('react-flow-canvas')
    const box = await canvas.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.height).toBeGreaterThan(0)
  })

  test('all 4 initial nodes are present on tablet', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow__node', { timeout: 10000 })
    const nodes = page.locator('.react-flow__node')
    await expect(nodes).toHaveCount(4)
  })
})
