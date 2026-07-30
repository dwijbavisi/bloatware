/**
 * Interaction controller -- binds named behaviors to elements via `data-interaction`.
 *
 * @example
 * // Usage in HTML:
 * // <details data-interaction="dismiss-outside">...</details>
 * //
 * // Usage in TypeScript:
 * // import { register } from "./interaction";
 * // register("my-behavior", (el) => { console.log(el); });
 */

/**
 * A callback function to clean up and teardown an active behavior.
 *
 * @returns void
 */
type Teardown = () => void;

/**
 * A function that initializes a specific interaction behavior on a DOM element.
 *
 * @param el - The DOM element to apply the behavior to.
 * @returns An optional teardown callback, or void.
 */
type BehaviorSetup = (el: Element) => Teardown | void;

const _behaviors = new Map<string, BehaviorSetup>();

/**
 * Registers a named behavior. The setup function is called for each element that declares it.
 *
 * @param name - The string identifier for the behavior (e.g., "dismiss-outside").
 * @param setup - The setup function to execute when the behavior is bound.
 * @returns void
 * @example
 * register("fade-in", (el) => { el.classList.add("visible"); });
 */
export function register(name: string, setup: BehaviorSetup): void {
    _behaviors.set(name, setup);
}

/**
 * Applies all registered behaviors to elements containing `data-interaction` attributes.
 *
 * @returns void
 * @example
 * init(); // Manually triggers a scan of the DOM for data-interaction attributes.
 */
export function init(): void {
    document.querySelectorAll<HTMLElement>("[data-interaction]").forEach((el) => {
        const names = (el.dataset.interaction ?? "").split(/\s+/).filter(Boolean);
        for (const name of names) {
            _behaviors.get(name)?.(el);
        }
    });
}

/**
 * Built-in: dismiss-outside
 * Closes a <details> HTML element when the user clicks anywhere outside of it.
 */
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

/**
 * Auto-initialization
 * Automatically runs the init function when the DOM is completely loaded.
 */
document.addEventListener("DOMContentLoaded", init);
