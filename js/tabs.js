/**
 * @file ARIA tablist keyboard and click navigation.
 * @module tabs
 *
 * Implements the WAI-ARIA Authoring Practices Guide tablist pattern:
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * Behaviour:
 * - Clicking a tab activates it and reveals its panel.
 * - ArrowRight / ArrowLeft move focus between tabs (roving tabindex).
 * - The active tab has `aria-selected="true"`; its panel has `aria-hidden="false"`.
 */

// ── INIT ──────────────────────────────────────────────────────────────────────

/**
 * Attaches click and keyboard event listeners to all `[role="tab"]` elements.
 * Must be called once after the DOM is ready.
 */
export function initTabs() {
  const tabs = /** @type {HTMLElement[]} */ (
    Array.from(document.querySelectorAll('[role="tab"]'))
  );
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab, tabs));
    tab.addEventListener("keydown", (e) =>
      onTabKeydown(/** @type {KeyboardEvent} */ (e), tab, tabs),
    );
  });
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * Activates the given tab: sets `aria-selected` on all tabs and toggles
 * `aria-hidden` on all tab panels accordingly.
 *
 * @param {HTMLElement}   activeTab  The tab to activate
 * @param {HTMLElement[]} tabs       All sibling tabs in the tablist
 */
function activateTab(activeTab, tabs) {
  tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
  activeTab.setAttribute("aria-selected", "true");
  const panelId = activeTab.getAttribute("aria-controls");
  document.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
    panel.setAttribute("aria-hidden", panel.id === panelId ? "false" : "true");
  });
}

/**
 * Handles ArrowLeft / ArrowRight keyboard navigation within the tablist,
 * wrapping focus at the ends (WCAG 2.1.1 — keyboard accessible).
 *
 * @param {KeyboardEvent} event
 * @param {HTMLElement}   tab   The currently focused tab
 * @param {HTMLElement[]} tabs  All sibling tabs
 */
function onTabKeydown(event, tab, tabs) {
  const i = tabs.indexOf(tab);
  if (event.key === "ArrowRight") {
    tabs[(i + 1) % tabs.length].focus();
  } else if (event.key === "ArrowLeft") {
    tabs[(i - 1 + tabs.length) % tabs.length].focus();
  }
}
