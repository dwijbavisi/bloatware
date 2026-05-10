/**
 * Interaction controller — binds named behaviors to elements via `data-interaction`.
 *
 * Usage in HTML:
 *   <details data-interaction="dismiss-outside">...</details>
 *
 * Usage in TypeScript (to add custom behaviors before DOMContentLoaded fires):
 *   import { register } from "./interaction";
 *   register("my-behavior", (el) => { ... });
 */

type Teardown = () => void;
type BehaviorSetup = (el: Element) => Teardown | void;

const _behaviors = new Map<string, BehaviorSetup>();

/** Register a named behavior. The setup function is called for each element that declares it. */
export function register(name: string, setup: BehaviorSetup): void {
    _behaviors.set(name, setup);
}

/** Apply all registered behaviors to elements with `data-interaction` attributes. */
export function init(): void {
    document.querySelectorAll<HTMLElement>("[data-interaction]").forEach((el) => {
        const names = (el.dataset.interaction ?? "").split(/\s+/).filter(Boolean);
        for (const name of names) {
            _behaviors.get(name)?.(el);
        }
    });
}

// ─── Built-in: dismiss-outside ────────────────────────────────────────────────
// Closes a <details> element when the user clicks anywhere outside of it.

register("dismiss-outside", (el) => {
    if (!(el instanceof HTMLDetailsElement)) return;

    const handler = (e: MouseEvent): void => {
        if (el.open && !el.contains(e.target as Node)) {
            el.open = false;
        }
    };

    // Capture phase so we intercept before the click reaches children.
    document.addEventListener("click", handler, true);
});

// ─── Auto-init ────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", init);
