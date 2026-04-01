import { test, expect, type Page } from '@playwright/test'

// Helper: wait for React Flow nodes to be ready
async function waitForNodes(page: Page) {
  await page.waitForSelector('.react-flow__node', { timeout: 10000 })
}

// Helper: click the org-node div inside a react-flow wrapper.
// React Flow wraps nodes in a div that intercepts pointer events, so we
// target the inner [data-testid] element and dispatch a synthetic click.
async function clickOrgNode(page: Page, nodeTestId: string) {
  const node = page.locator(`[data-testid="${nodeTestId}"]`)
  await node.click()
}

test.describe('Node Editing via Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('organo-core-data')
      localStorage.setItem('organo-tour-completed', 'true')
    })
    await page.goto('/')
    await waitForNodes(page)
  })

  // ──────────────────────────────────────────────
  // Person node editing
  // ──────────────────────────────────────────────

  test('clicking a person node opens the sidebar', async ({ page }) => {
    await clickOrgNode(page, 'org-node-node_ceo')

    const sidebar = page.getByTestId('sidebar')
    // Sidebar slides in via transform — wait until it is not translated away
    await expect(sidebar).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 3000 })
  })

  test('sidebar is hidden when no node is selected', async ({ page }) => {
    // At page load nothing is selected — sidebar is off-screen
    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveCSS('pointer-events', 'none')
  })

  test('editing the CEO name and saving updates the canvas node', async ({ page }) => {
    // 1. Click CEO node
    await clickOrgNode(page, 'org-node-node_ceo')

    // 2. Sidebar should appear (pointer-events become auto)
    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveCSS('pointer-events', 'auto', { timeout: 3000 })

    // 3. Clear the name field and type new name
    const nameInput = page.getByTestId('input-name')
    await nameInput.fill('テスト太郎')

    // 4. Click save
    await page.getByTestId('btn-save-person').click()

    // 5. The PersonCard on the canvas should now show the updated name.
    //    There can be multiple [data-testid="person-name"] elements — find the
    //    one inside the CEO node wrapper.
    const ceoNode = page.locator('[data-testid="org-node-node_ceo"]')
    await expect(ceoNode.getByTestId('person-name')).toHaveText('テスト太郎', { timeout: 5000 })
  })

  test('editing the role field updates the canvas node', async ({ page }) => {
    await clickOrgNode(page, 'org-node-node_ceo')

    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveCSS('pointer-events', 'auto', { timeout: 3000 })

    await page.getByTestId('input-role').fill('会長')
    await page.getByTestId('btn-save-person').click()

    const ceoNode = page.locator('[data-testid="org-node-node_ceo"]')
    await expect(ceoNode.getByTestId('person-role')).toContainText('会長', { timeout: 5000 })
  })

  test('validation prevents saving an empty name', async ({ page }) => {
    await clickOrgNode(page, 'org-node-node_cto')

    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveCSS('pointer-events', 'auto', { timeout: 3000 })

    // Clear the required name field completely
    await page.getByTestId('input-name').fill('')
    await page.getByTestId('btn-save-person').click()

    // CTO name should remain unchanged — validation should block the save
    const ctoNode = page.locator('[data-testid="org-node-node_cto"]')
    await expect(ctoNode.getByTestId('person-name')).toHaveText('Michael Rodriguez', { timeout: 3000 })
  })

  test('clicking the pane deselects the node and hides the sidebar', async ({ page }) => {
    await clickOrgNode(page, 'org-node-node_ceo')

    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveCSS('pointer-events', 'auto', { timeout: 3000 })

    // Click an empty area of the pane to deselect (use center-right to avoid sidebar overlap)
    const pane = page.locator('.react-flow__pane')
    const box = await pane.boundingBox()
    await pane.click({ position: { x: box!.width - 50, y: box!.height / 2 } })

    await expect(sidebar).toHaveCSS('pointer-events', 'none', { timeout: 3000 })
  })

  // ──────────────────────────────────────────────
  // Unit node editing
  // ──────────────────────────────────────────────

  test('clicking a unit node opens the sidebar with unit form', async ({ page }) => {
    await clickOrgNode(page, 'org-node-node_unit_hr')

    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveCSS('pointer-events', 'auto', { timeout: 3000 })

    // Unit form contains the unit-name input instead of person name input
    await expect(page.getByTestId('input-unit-name')).toBeVisible()
  })

  test('editing the HR unit name and saving updates the canvas node', async ({ page }) => {
    await clickOrgNode(page, 'org-node-node_unit_hr')

    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveCSS('pointer-events', 'auto', { timeout: 3000 })

    await page.getByTestId('input-unit-name').fill('テスト部門')
    await page.getByTestId('btn-save-unit').click()

    const hrNode = page.locator('[data-testid="org-node-node_unit_hr"]')
    await expect(hrNode.getByTestId('unit-name')).toHaveText('テスト部門', { timeout: 5000 })
  })

  test('form resets when a different node is selected', async ({ page }) => {
    // Select CEO, type something but do NOT save
    await clickOrgNode(page, 'org-node-node_ceo')
    let sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveCSS('pointer-events', 'auto', { timeout: 3000 })
    await page.getByTestId('input-name').fill('捨て書き')

    // Now click a different node — form should reset to that node's data
    await clickOrgNode(page, 'org-node-node_cto')
    sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveCSS('pointer-events', 'auto', { timeout: 3000 })

    // The name input should show the CTO's name, not the unsaved text
    await expect(page.getByTestId('input-name')).toHaveValue('Michael Rodriguez', { timeout: 3000 })
  })
})
