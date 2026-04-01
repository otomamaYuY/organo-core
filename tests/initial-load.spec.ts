import { test, expect } from '@playwright/test'

test.describe('Initial Load & Basic Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('organo-core-data')
      localStorage.setItem('organo-tour-completed', 'true')
    })
  })

  test('app loads without crash', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('app-root')).toBeVisible()
  })

  test('React Flow canvas is mounted', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('react-flow-canvas')).toBeVisible()
    await expect(page.locator('.react-flow')).toBeVisible()
  })

  test('initial org chart nodes are rendered', async ({ page }) => {
    await page.goto('/')
    // Wait for React Flow to finish rendering nodes
    await page.waitForSelector('.react-flow__node', { timeout: 10000 })

    // 4 initial nodes: CEO, CTO, COO, HR unit
    const nodes = page.locator('.react-flow__node')
    await expect(nodes).toHaveCount(4)
  })

  test('CEO node displays Dr. Sarah Chen', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow__node', { timeout: 10000 })

    // The CEO PersonCard should show the name and role
    await expect(page.locator('.react-flow__node').filter({ hasText: 'Dr. Sarah Chen' })).toBeVisible()
    await expect(page.locator('.react-flow__node').filter({ hasText: 'CEO' })).toBeVisible()
  })

  test('CTO node displays Michael Rodriguez', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow__node', { timeout: 10000 })

    await expect(page.locator('.react-flow__node').filter({ hasText: 'Michael Rodriguez' })).toBeVisible()
    await expect(page.locator('.react-flow__node').filter({ hasText: 'CTO' })).toBeVisible()
  })

  test('COO node displays Emily Watson', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow__node', { timeout: 10000 })

    await expect(page.locator('.react-flow__node').filter({ hasText: 'Emily Watson' })).toBeVisible()
    await expect(page.locator('.react-flow__node').filter({ hasText: 'COO' })).toBeVisible()
  })

  test('HR unit node displays 人事部', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow__node', { timeout: 10000 })

    await expect(page.locator('.react-flow__node').filter({ hasText: '人事部' })).toBeVisible()
  })

  test('initial edges are rendered', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow__edge', { timeout: 10000 })

    // 3 edges: CEO→CTO, CEO→COO, COO→HR
    const edges = page.locator('.react-flow__edge')
    await expect(edges).toHaveCount(3)
  })
})
