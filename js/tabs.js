/**
 * @file ARIA tablist keyboard and click navigation.
 * @module tabs
 *
 * Implements the WAI-ARIA Authoring Practices Guide tablist pattern
 * (automatic-activation variant):
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * Behaviour:
 * - Clicking or pressing Space / Enter on a tab activates it.
 * - ArrowRight / ArrowLeft move focus and automatically activate the new tab.
 * - Home / End jump to the first / last tab and activate it.
 * - Roving tabindex: the active tab has `tabindex="0"`;
 *   all others have `tabindex="-1"` so Tab key skips over them.
 * - The active tab has `aria-selected="true"`; its panel has `aria-hidden="false"`.
 */

// ── INIT ──────────────────────────────────────────────────────────────────────

/**
 * Attaches click and keyboard event listeners to all `[role="tab"]` elements
 * and initialises the roving tabindex.
 * Must be called once after the DOM is ready.
 */
export function initTabs() {
  const tabs = /** @type {HTMLElement[]} */ (
    Array.from(document.querySelectorAll('[role="tab"]'))
  );
  // Establish roving tabindex: only the initially-selected tab is in the
  // tab sequence; the rest are reachable via arrow keys.
  tabs.forEach((tab, i) => {
    tab.setAttribute("tabindex", i === 0 ? "0" : "-1");
    tab.addEventListener("click", () => activateTab(tab, tabs));
    tab.addEventListener("keydown", (e) =>
      onTabKeydown(/** @type {KeyboardEvent} */ (e), tab, tabs),
    );
  });
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * Activates the given tab: updates `aria-selected`, `tabindex` (roving) and
 * `aria-hidden` on all tab panels.
 *
 * @param {HTMLElement}   activeTab  The tab to activate
 * @param {HTMLElement[]} tabs       All sibling tabs in the tablist
 */
function activateTab(activeTab, tabs) {
  tabs.forEach((t) => {
    t.setAttribute("aria-selected", "false");
    t.setAttribute("tabindex", "-1");
  });
  activeTab.setAttribute("aria-selected", "true");
  activeTab.setAttribute("tabindex", "0");
  const panelId = activeTab.getAttribute("aria-controls");
  document.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
    panel.setAttribute("aria-hidden", panel.id === panelId ? "false" : "true");
  });
}

/**
 * Handles keyboard navigation within the tablist (WCAG 2.1.1).
 *
 * Arrow keys move focus and activate the new tab (automatic activation).
 * Home / End jump to the first / last tab.
 * Space and Enter explicitly activate the currently focused tab.
 *
 * @param {KeyboardEvent} event
 * @param {HTMLElement}   tab   The currently focused tab
 * @param {HTMLElement[]} tabs  All sibling tabs
 */
function onTabKeydown(event, tab, tabs) {
  const count = tabs.length;
  const i = tabs.indexOf(tab);
  /** @type {HTMLElement|undefined} */
  let target;

  switch (event.key) {
    case "ArrowRight":
      target = tabs[(i + 1) % count];
      break;
    case "ArrowLeft":
      target = tabs[(i - 1 + count) % count];
      break;
    case "Home":
      target = tabs[0];
      break;
    case "End":
      target = tabs[count - 1];
      break;
    case " ":
    case "Enter":
      activateTab(tab, tabs);
      event.preventDefault();
      return;
    default:
      return;
  }

  if (target) {
    event.preventDefault();
    target.focus();
    activateTab(target, tabs);
  }
}
