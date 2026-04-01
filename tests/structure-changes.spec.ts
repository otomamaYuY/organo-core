import { test, expect, type Page } from '@playwright/test'

// Helper: wait for all React Flow nodes to be mounted
async function waitForNodes(page: Page) {
  await page.waitForSelector('.react-flow__node', { timeout: 10000 })
}

// Helper: count currently visible (non-hidden) React Flow nodes
function nodeLocator(page: Page) {
  return page.locator('.react-flow__node')
}

// Helper: count currently visible React Flow edges
function edgeLocator(page: Page) {
  return page.locator('.react-flow__edge')
}

// Helper: open the context menu for a specific org-node
async function rightClickOrgNode(page: Page, nodeTestId: string) {
  const node = page.locator(`[data-testid="${nodeTestId}"]`)
  await node.click({ button: 'right' })
}

test.describe('Structure Changes — Add & Delete Nodes', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('organo-core-data')
      localStorage.setItem('organo-tour-completed', 'true')
    })
    await page.goto('/')
    await waitForNodes(page)
  })

  // ──────────────────────────────────────────────
  // Context menu appearance
  // ──────────────────────────────────────────────

  test('right-clicking a node shows the context menu', async ({ page }) => {
    await rightClickOrgNode(page, 'org-node-node_ceo')

    const menu = page.getByTestId('context-menu')
    await expect(menu).toBeVisible({ timeout: 3000 })

    // All expected menu items must be present
    await expect(page.getByTestId('ctx-add-person')).toBeVisible()
    await expect(page.getByTestId('ctx-add-unit')).toBeVisible()
    await expect(page.getByTestId('ctx-edit')).toBeVisible()
    await expect(page.getByTestId('ctx-collapse')).toBeVisible()
    await expect(page.getByTestId('ctx-delete')).toBeVisible()
  })

  test('context menu closes when clicking outside', async ({ page }) => {
    await rightClickOrgNode(page, 'org-node-node_ceo')
    await expect(page.getByTestId('context-menu')).toBeVisible({ timeout: 3000 })

    // Click somewhere neutral on the pane
    await page.locator('.react-flow__pane').click({ position: { x: 10, y: 10 } })

    await expect(page.getByTestId('context-menu')).not.toBeVisible({ timeout: 3000 })
  })

  // ──────────────────────────────────────────────
  // Add person node via context menu
  // ──────────────────────────────────────────────

  test('adding a person node below CEO increases node count by 1', async ({ page }) => {
    const initialCount = await nodeLocator(page).count()

    await rightClickOrgNode(page, 'org-node-node_ceo')
    await expect(page.getByTestId('ctx-add-person')).toBeVisible({ timeout: 3000 })
    await page.getByTestId('ctx-add-person').click()

    // Wait for the new node to appear
    await expect(nodeLocator(page)).toHaveCount(initialCount + 1, { timeout: 5000 })
  })

  test('new person node is named 新しいメンバー (default text)', async ({ page }) => {
    await rightClickOrgNode(page, 'org-node-node_ceo')
    await page.getByTestId('ctx-add-person').click()

    // The newly created node renders a PersonCard with the default name
    const newNode = page.locator('.react-flow__node').filter({ hasText: '新しいメンバー' })
    await expect(newNode).toBeVisible({ timeout: 5000 })
  })

  test('adding a person node also creates a connecting edge', async ({ page }) => {
    const initialEdgeCount = await edgeLocator(page).count()

    await rightClickOrgNode(page, 'org-node-node_ceo')
    await page.getByTestId('ctx-add-person').click()

    await expect(edgeLocator(page)).toHaveCount(initialEdgeCount + 1, { timeout: 5000 })
  })

  // ──────────────────────────────────────────────
  // Add unit node via context menu
  // ──────────────────────────────────────────────

  test('adding a unit node below CTO increases node count by 1', async ({ page }) => {
    const initialCount = await nodeLocator(page).count()

    await rightClickOrgNode(page, 'org-node-node_cto')
    await expect(page.getByTestId('ctx-add-unit')).toBeVisible({ timeout: 3000 })
    await page.getByTestId('ctx-add-unit').click()

    await expect(nodeLocator(page)).toHaveCount(initialCount + 1, { timeout: 5000 })
  })

  test('new unit node is named 新しい組織 (default text)', async ({ page }) => {
    await rightClickOrgNode(page, 'org-node-node_cto')
    await page.getByTestId('ctx-add-unit').click()

    const newNode = page.locator('.react-flow__node').filter({ hasText: '新しい組織' })
    await expect(newNode).toBeVisible({ timeout: 5000 })
  })

  // ──────────────────────────────────────────────
  // Delete node via sidebar delete button
  // ──────────────────────────────────────────────

  test('deleting a newly added node via sidebar reduces node count back', async ({ page }) => {
    // Add a person node first so we know its default name
    const initialCount = await nodeLocator(page).count()
    await rightClickOrgNode(page, 'org-node-node_ceo')
    await page.getByTestId('ctx-add-person').click()
    await expect(nodeLocator(page)).toHaveCount(initialCount + 1, { timeout: 5000 })

    // The new node is automatically selected (addPersonNode sets selectedNodeId).
    // Sidebar should already be open.
    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveCSS('pointer-events', 'auto', { timeout: 3000 })

    // Click the delete button in the sidebar header
    await page.getByTestId('sidebar-delete-btn').click()

    // Node count should return to the original value
    await expect(nodeLocator(page)).toHaveCount(initialCount, { timeout: 5000 })
  })

  test('deleting a node via sidebar also removes its connected edges', async ({ page }) => {
    // Add a person node (which creates 1 edge from CEO)
    const initialEdgeCount = await edgeLocator(page).count()
    await rightClickOrgNode(page, 'org-node-node_ceo')
    await page.getByTestId('ctx-add-person').click()
    await expect(edgeLocator(page)).toHaveCount(initialEdgeCount + 1, { timeout: 5000 })

    // Sidebar is open because the new node is auto-selected
    await expect(page.getByTestId('sidebar')).toHaveCSS('pointer-events', 'auto', { timeout: 3000 })
    await page.getByTestId('sidebar-delete-btn').click()

    // Edge count should return to the original
    await expect(edgeLocator(page)).toHaveCount(initialEdgeCount, { timeout: 5000 })
  })

  // ──────────────────────────────────────────────
  // Delete node via context menu
  // ──────────────────────────────────────────────

  test('deleting a node via context menu reduces node count by 1', async ({ page }) => {
    // First add a node so we are not deleting one of the important initial nodes
    const initialCount = await nodeLocator(page).count()
    await rightClickOrgNode(page, 'org-node-node_ceo')
    await page.getByTestId('ctx-add-person').click()
    await expect(nodeLocator(page)).toHaveCount(initialCount + 1, { timeout: 5000 })

    // Find the newly added node by its default text and right-click it
    const newNode = page.locator('.react-flow__node').filter({ hasText: '新しいメンバー' })
    await newNode.click({ button: 'right' })

    await expect(page.getByTestId('ctx-delete')).toBeVisible({ timeout: 3000 })
    await page.getByTestId('ctx-delete').click()

    await expect(nodeLocator(page)).toHaveCount(initialCount, { timeout: 5000 })
  })

  test('deleting a node via context menu also removes its connected edges', async ({ page }) => {
    const initialEdgeCount = await edgeLocator(page).count()

    // Add a child node (creates 1 new edge)
    await rightClickOrgNode(page, 'org-node-node_coo')
    await page.getByTestId('ctx-add-person').click()
    await expect(edgeLocator(page)).toHaveCount(initialEdgeCount + 1, { timeout: 5000 })

    // Right-click the new node and delete via context menu
    const newNode = page.locator('.react-flow__node').filter({ hasText: '新しいメンバー' })
    await newNode.click({ button: 'right' })
    await expect(page.getByTestId('ctx-delete')).toBeVisible({ timeout: 3000 })
    await page.getByTestId('ctx-delete').click()

    // Edge should be gone along with the node
    await expect(edgeLocator(page)).toHaveCount(initialEdgeCount, { timeout: 5000 })
  })

  // ──────────────────────────────────────────────
  // Sidebar is hidden after node deletion
  // ──────────────────────────────────────────────

  test('sidebar closes automatically after deleting the selected node', async ({ page }) => {
    // Add, then open sidebar (auto-selected), then delete
    await rightClickOrgNode(page, 'org-node-node_ceo')
    await page.getByTestId('ctx-add-person').click()

    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveCSS('pointer-events', 'auto', { timeout: 3000 })

    await page.getByTestId('sidebar-delete-btn').click()

    // After deletion selectedNodeId becomes null — sidebar should slide away
    await expect(sidebar).toHaveCSS('pointer-events', 'none', { timeout: 3000 })
  })

  // ──────────────────────────────────────────────
  // Context menu "Edit" action opens sidebar
  // ──────────────────────────────────────────────

  test('context menu edit action opens the sidebar for the node', async ({ page }) => {
    await rightClickOrgNode(page, 'org-node-node_cto')
    await expect(page.getByTestId('ctx-edit')).toBeVisible({ timeout: 3000 })
    await page.getByTestId('ctx-edit').click()

    const sidebar = page.getByTestId('sidebar')
    await expect(sidebar).toHaveCSS('pointer-events', 'auto', { timeout: 3000 })

    // The person name input should be pre-filled with the CTO's name
    await expect(page.getByTestId('input-name')).toHaveValue('Michael Rodriguez', { timeout: 3000 })
  })
})
