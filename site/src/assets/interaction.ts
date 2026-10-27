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
function register(name: string, setup: BehaviorSetup): void {
    _behaviors.set(name, setup);
}

/**
 * Applies all registered behaviors to elements containing `data-interaction` attributes.
 *
 * @returns void
 * @example
 * init(); // Manually triggers a scan of the DOM for data-interaction attributes.
 */
function init(): void {
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
 * Built-in: theme-toggle
 * Switches between Biocircuit dark and light color themes, persisting user choice to localStorage.
 */
register("theme-toggle", (el) => {
    if (!(el instanceof HTMLElement)) return;

    const renderIcon = (btn: HTMLElement, theme: string) => {
        if (theme === "light") {
            btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
            btn.setAttribute("title", "Active: Light Theme. Click for Dark.");
        } else {
            btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
            btn.setAttribute("title", "Active: Dark Theme. Click for Light.");
        }
    };

    const getActiveTheme = (): string => {
        const explicit = document.documentElement.getAttribute("data-theme");
        if (explicit) return explicit;
        return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    };

    renderIcon(el, getActiveTheme());

    el.addEventListener("click", () => {
        const current = getActiveTheme();
        const next = current === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        try {
            localStorage.setItem("biocircuit-theme", next);
        } catch {
            // ignore storage failure
        }
        renderIcon(el, next);
    });
});

/**
 * Auto-initialization
 * Automatically runs the init function when the DOM is completely loaded.
 */
document.addEventListener("DOMContentLoaded", init);
