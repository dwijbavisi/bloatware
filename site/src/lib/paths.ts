function splitRoute(route: string): string[] {
    if (route === "/") {
        return [];
    }

    return route.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
}

export function relativeRouteHref(fromRoute: string, toRoute: string): string {
    const from = splitRoute(fromRoute);
    const to = splitRoute(toRoute);

    let common = 0;
    while (common < from.length && common < to.length && from[common] === to[common]) {
        common += 1;
    }

    const upCount = from.length - common;
    const down = to.slice(common);

    if (upCount === 0 && down.length === 0) {
        return "./index.html";
    }

    const upPart = upCount > 0 ? "../".repeat(upCount) : "";
    const downPart = down.length > 0 ? `${down.join("/")}/` : "";
    const base = `${upPart}${downPart}` || "./";

    return `${base}index.html`;
}

export function relativeAssetHref(fromRoute: string, assetName: string): string {
    const from = splitRoute(fromRoute);
    const upPart = from.length > 0 ? "../".repeat(from.length) : "";
    return `${upPart}${assetName}`;
}
