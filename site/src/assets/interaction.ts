import { SearchEngine, type SearchMatch } from '../lib/search-engine';
import { relativeRouteHref, relativeAssetHref } from '../../modules/link-resolver';

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
 * Built-in: mobile-menu-toggle
 * Toggles responsive mobile navigation drawer and handles outside/escape dismissal.
 */
register("mobile-menu-toggle", (el) => {
    if (!(el instanceof HTMLElement)) return;
    const header = el.closest(".site-header");
    if (!header) return;

    const toggle = (force?: boolean) => {
        const isOpen = force !== undefined ? force : !header.classList.contains("mobile-nav-active");
        header.classList.toggle("mobile-nav-active", isOpen);
        el.setAttribute("aria-expanded", String(isOpen));
    };

    el.addEventListener("click", (e) => {
        e.stopPropagation();
        toggle();
    });

    // Close when clicking nav links
    header.querySelectorAll(".header-nav a").forEach((link) => {
        link.addEventListener("click", () => {
            toggle(false);
        });
    });

    // Close on click outside
    document.addEventListener("click", (e) => {
        if (header.classList.contains("mobile-nav-active") && !header.contains(e.target as Node)) {
            toggle(false);
        }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && header.classList.contains("mobile-nav-active")) {
            toggle(false);
        }
    });
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

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Built-in: command-palette
 * Provides instant full-text search with keyboard navigation, hotkeys (Cmd+K / /), and fuzzy ranking.
 */
register("command-palette", (el) => {
    if (!(el instanceof HTMLDialogElement)) return;
    const dialog = el;
    const input = dialog.querySelector<HTMLInputElement>(".command-palette-input");
    const resultsList = dialog.querySelector<HTMLUListElement>(".command-palette-results");
    const statusEl = dialog.querySelector<HTMLElement>(".command-palette-status");
    const closeBtn = dialog.querySelector<HTMLElement>("[data-action='close-search']");

    if (!input || !resultsList) return;

    const engine = new SearchEngine();
    let currentResults: SearchMatch[] = [];
    let selectedIndex = 0;
    let isLoading = false;

    const currentRoute = document.documentElement.dataset.route || "/";

    const loadIndex = async (): Promise<void> => {
        if (engine.isLoaded() || isLoading) return;
        isLoading = true;
        if (statusEl) statusEl.textContent = "Loading index signals...";
        try {
            const indexUrl = relativeAssetHref(currentRoute, "search-index.json");
            const res = await fetch(indexUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            engine.setIndex(data);
            if (statusEl) statusEl.textContent = "";
            renderSearch(input.value);
        } catch (err) {
            if (statusEl) statusEl.textContent = "Failed to load search index.";
            console.error("Search index load error:", err);
        } finally {
            isLoading = false;
        }
    };

    const updateSelection = (newIndex: number): void => {
        if (currentResults.length === 0) return;
        selectedIndex = Math.max(0, Math.min(newIndex, currentResults.length - 1));
        const items = resultsList.querySelectorAll<HTMLElement>(".command-palette-item");
        items.forEach((item, idx) => {
            const isSelected = idx === selectedIndex;
            item.classList.toggle("selected", isSelected);
            item.setAttribute("aria-selected", String(isSelected));
            if (isSelected) {
                item.scrollIntoView({ block: "nearest" });
                input.setAttribute("aria-activedescendant", item.id);
            }
        });
    };

    const renderSearch = (query: string): void => {
        if (!engine.isLoaded()) {
            resultsList.innerHTML = "";
            return;
        }

        currentResults = engine.query(query, 8);
        selectedIndex = 0;

        if (currentResults.length === 0) {
            resultsList.innerHTML = `<li class="command-palette-empty">No results found for "${escapeHtml(query)}"</li>`;
            if (statusEl) statusEl.textContent = "No results found";
            input.removeAttribute("aria-activedescendant");
            return;
        }

        if (statusEl) {
            statusEl.textContent = `${currentResults.length} result${currentResults.length === 1 ? '' : 's'} available`;
        }

        resultsList.innerHTML = currentResults
            .map((match, idx) => {
                const targetHref = relativeRouteHref(currentRoute, match.item.route);
                const itemId = `search-item-${idx}`;
                const isSelected = idx === 0;
                return `
                    <li id="${itemId}" class="command-palette-item${isSelected ? ' selected' : ''}" role="option" aria-selected="${isSelected}" data-index="${idx}">
                        <a href="${targetHref}" class="command-palette-item-link">
                            <div class="command-palette-item-top">
                                <span class="command-palette-badge kind-${match.item.kind}">${match.item.kind}</span>
                                <span class="command-palette-item-title">${match.titleHtml || escapeHtml(match.item.title)}</span>
                                ${match.item.date ? `<span class="command-palette-item-date">${match.item.date}</span>` : ''}
                            </div>
                            ${match.snippet ? `<div class="command-palette-item-snippet">${match.snippet}</div>` : ''}
                        </a>
                    </li>
                `;
            })
            .join("");

        // Hover mouse updates selected index
        resultsList.querySelectorAll<HTMLElement>(".command-palette-item").forEach((item) => {
            item.addEventListener("mouseenter", () => {
                const idx = parseInt(item.dataset.index || "0", 10);
                updateSelection(idx);
            });
        });
    };

    const openModal = (): void => {
        if (!dialog.open) {
            const header = document.querySelector(".site-header");
            if (header?.classList.contains("mobile-nav-active")) {
                header.classList.remove("mobile-nav-active");
                const navToggle = header.querySelector(".mobile-nav-toggle");
                navToggle?.setAttribute("aria-expanded", "false");
            }

            dialog.showModal();
            loadIndex();
            input.focus();
            input.select();
            renderSearch(input.value);
        }
    };

    const closeModal = (): void => {
        if (dialog.open) {
            dialog.close();
        }
    };

    // Close when clicking the dialog backdrop
    dialog.addEventListener("click", (e) => {
        if (e.target === dialog) {
            closeModal();
        }
    });

    closeBtn?.addEventListener("click", closeModal);

    // Live search input
    input.addEventListener("input", () => {
        renderSearch(input.value);
    });

    // Keyboard navigation within the palette
    dialog.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (currentResults.length > 0) {
                updateSelection((selectedIndex + 1) % currentResults.length);
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (currentResults.length > 0) {
                updateSelection((selectedIndex - 1 + currentResults.length) % currentResults.length);
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            const activeItem = resultsList.querySelector<HTMLAnchorElement>(".command-palette-item.selected .command-palette-item-link");
            if (activeItem) {
                closeModal();
                activeItem.click();
            }
        }
    });

    // Global keyboard shortcuts: Cmd+K / Ctrl+K and '/'
    window.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            if (dialog.open) {
                closeModal();
            } else {
                openModal();
            }
            return;
        }

        if (e.key === "/" && !dialog.open) {
            const active = document.activeElement;
            const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || (active as HTMLElement)?.isContentEditable;
            if (!isInput) {
                e.preventDefault();
                openModal();
            }
        }
    });

    // Connect open buttons across the document
    document.querySelectorAll("[data-action='open-search']").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            openModal();
        });
    });
});

/**
 * Built-in: not-found-suggestions
 * On the 404 page, automatically extracts the requested URL path as a read-only query,
 * fetches the search index, and presents closest-matching article recommendations.
 */
register("not-found-suggestions", (el) => {
    if (!(el instanceof HTMLElement)) return;

    const queryDisplay = el.querySelector<HTMLElement>("[data-target='query-display']");
    const statusEl = el.querySelector<HTMLElement>("[data-target='status']");
    const listEl = el.querySelector<HTMLUListElement>("[data-target='suggestions-list']");

    if (!listEl) return;

    // 1. Derive search query from actual browser pathname
    const rawPath = window.location.pathname;
    const pathWithoutBase = rawPath.replace(/^\/bloatware\/?/, '/');
    let decoded = '';
    try {
        decoded = decodeURIComponent(pathWithoutBase);
    } catch {
        decoded = pathWithoutBase;
    }

    // Strip .html and index.html
    const normalizedPath = decoded.replace(/\/index\.html\/?$/i, '').replace(/\.html\/?$/i, '');

    // Display the searched coordinate in the read-only pill
    if (queryDisplay) {
        queryDisplay.textContent = rawPath || '/';
        queryDisplay.setAttribute('title', `Coordinate: ${rawPath}`);
    }

    // Extract search query tokens (removing slashes, hyphens, and underscores)
    const searchQuery = normalizedPath
        .replace(/[\/\-_.]+/g, ' ')
        .trim();

    const engine = new SearchEngine();
    const currentRoute = document.documentElement.dataset.route || "/";

    const runRecommendation = async () => {
        if (statusEl) statusEl.textContent = "Scanning index signals…";

        try {
            const indexUrl = relativeAssetHref(currentRoute, "search-index.json");
            const res = await fetch(indexUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            engine.setIndex(data);

            const recommendations = engine.recommendClosest(searchQuery, 5);

            if (recommendations.length === 0) {
                if (statusEl) statusEl.textContent = "No direct coordinate matches.";
                listEl.innerHTML = `
                    <li class="error-suggestion-empty">
                        <p>No related articles match this specific coordinate path.</p>
                        <p class="error-suggestion-empty-sub">Use the navigation options below to explore the archives.</p>
                    </li>
                `;
                return;
            }

            if (statusEl) {
                statusEl.textContent = `${recommendations.length} recommended article${recommendations.length === 1 ? '' : 's'}`;
            }

            listEl.innerHTML = recommendations
                .map((match) => {
                    const targetHref = relativeRouteHref(currentRoute, match.item.route);
                    return `
                        <li class="error-suggestion-card">
                            <a href="${targetHref}" class="error-suggestion-link">
                                <div class="error-suggestion-card-header">
                                    <span class="command-palette-badge kind-${match.item.kind}">${match.item.kind}</span>
                                    <h4 class="error-suggestion-title">${match.titleHtml || escapeHtml(match.item.title)}</h4>
                                    ${match.item.date ? `<span class="error-suggestion-date">${match.item.date}</span>` : ''}
                                </div>
                                ${match.snippet ? `<p class="error-suggestion-snippet">${match.snippet}</p>` : ''}
                            </a>
                        </li>
                    `;
                })
                .join("");
        } catch (err) {
            console.error("404 recommendation failed to load search index:", err);
            if (statusEl) statusEl.textContent = "Recommendation service unavailable.";
        }
    };

    runRecommendation();
});

/**
 * Auto-initialization
 * Automatically runs the init function when the DOM is completely loaded.
 */
document.addEventListener("DOMContentLoaded", init);
