import type {
    BlockNode,
    BlockquoteNode,
    CodeBlockNode,
    HeadingNode,
    InlineNode,
    ListItem,
    ListNode,
    MathBlockNode,
    ParsedMetadata,
    ParseResult,
    ParagraphNode,
} from "./types";

function log(msg: string): void {
    console.log(`[${new Date().toISOString()}] [md/parser] ${msg}`);
}

// ─── Inline Parser ────────────────────────────────────────────────────────────

/**
 * Parse a flat string into a list of InlineNodes.
 * Processing order matters: longer/higher-priority patterns are matched first.
 */
export function parseInline(raw: string): InlineNode[] {
    const nodes: InlineNode[] = [];

    // Replace literal `<<...>>` with angle-bracket equivalents before processing
    const input = raw.replace(/<<([^>]*)>>/g, "<$1>");

    let remaining = input;

    while (remaining.length > 0) {
        // Hard line break: backslash at end of a line (before \n or at end)
        const brMatch = remaining.match(/^(.*?)\\\n([\s\S]*)/);
        if (brMatch) {
            if (brMatch[1].length > 0) {
                nodes.push(...parseInlineSpan(brMatch[1]));
            }
            nodes.push({ type: "br" });
            remaining = brMatch[2];
            continue;
        }

        // No more line breaks — parse the rest as a span
        nodes.push(...parseInlineSpan(remaining));
        break;
    }

    return nodes;
}

/**
 * Parse a single line (no `\\\n` line breaks) into InlineNodes.
 */
function parseInlineSpan(input: string): InlineNode[] {
    if (input.length === 0) return [];

    const nodes: InlineNode[] = [];
    let i = 0;

    while (i < input.length) {
        // Block-math sentinel should not appear here, but guard anyway
        if (input.startsWith("$$", i)) {
            const end = input.indexOf("$$", i + 2);
            if (end !== -1) {
                nodes.push({ type: "math-inline", source: input.slice(i + 2, end) });
                i = end + 2;
                continue;
            }
        }

        // Inline math: $...$
        if (input[i] === "$" && input[i + 1] !== "$") {
            const end = input.indexOf("$", i + 1);
            if (end !== -1) {
                nodes.push({ type: "math-inline", source: input.slice(i + 1, end) });
                i = end + 1;
                continue;
            }
        }

        // Inline code: `...`
        if (input[i] === "`") {
            const end = input.indexOf("`", i + 1);
            if (end !== -1) {
                nodes.push({ type: "inline-code", value: input.slice(i + 1, end) });
                i = end + 1;
                continue;
            }
        }

        // Bold: **...**
        if (input.startsWith("**", i)) {
            const end = input.indexOf("**", i + 2);
            if (end !== -1) {
                nodes.push({ type: "bold", children: parseInlineSpan(input.slice(i + 2, end)) });
                i = end + 2;
                continue;
            }
        }

        // Italic: *...* (not preceded/followed by *)
        if (input[i] === "*" && input[i + 1] !== "*") {
            const end = findItalicEnd(input, i + 1);
            if (end !== -1) {
                nodes.push({ type: "italic", children: parseInlineSpan(input.slice(i + 1, end)) });
                i = end + 1;
                continue;
            }
        }

        // Link: [text](href)
        if (input[i] === "[") {
            const bracketClose = input.indexOf("]", i + 1);
            if (bracketClose !== -1 && input[bracketClose + 1] === "(") {
                const parenClose = input.indexOf(")", bracketClose + 2);
                if (parenClose !== -1) {
                    const linkText = input.slice(i + 1, bracketClose);
                    const href = input.slice(bracketClose + 2, parenClose);
                    nodes.push({ type: "link", href, children: parseInlineSpan(linkText) });
                    i = parenClose + 1;
                    continue;
                }
            }
        }

        // Superscript: ^text^
        if (input[i] === "^") {
            const end = input.indexOf("^", i + 1);
            if (end !== -1) {
                nodes.push({ type: "sup", children: parseInlineSpan(input.slice(i + 1, end)) });
                i = end + 1;
                continue;
            }
        }

        // Subscript: ~text~
        if (input[i] === "~") {
            const end = input.indexOf("~", i + 1);
            if (end !== -1) {
                nodes.push({ type: "sub", children: parseInlineSpan(input.slice(i + 1, end)) });
                i = end + 1;
                continue;
            }
        }

        // Plain text — consume until the next special character
        const special = /[\$`*\[^~]/;
        let j = i + 1;
        while (j < input.length && !special.test(input[j])) {
            j++;
        }
        nodes.push({ type: "text", value: input.slice(i, j) });
        i = j;
    }

    return nodes;
}

function findItalicEnd(input: string, from: number): number {
    for (let i = from; i < input.length; i++) {
        if (input[i] === "*" && input[i + 1] !== "*") {
            return i;
        }
    }
    return -1;
}

// ─── Metadata Parser ──────────────────────────────────────────────────────────

function parseMetadata(raw: string): ParsedMetadata {
    const result: ParsedMetadata = { raw: {} };
    const lineRe = /^-\s+\*\*(.+?)\*\*:\s*(.+)$/;

    for (const line of raw.split(/\r?\n/)) {
        const m = line.match(lineRe);
        if (!m) continue;
        const key = m[1].toLowerCase().trim();
        const value = m[2].trim();
        result.raw[key] = value;
        if (key === "author") result.author = value;
        if (key === "published") result.published = value;
        if (key === "conceived") result.conceived = value;
    }

    return result;
}

// ─── Block Parser ─────────────────────────────────────────────────────────────

type RawBlock =
    | { kind: "heading"; level: number; text: string }
    | { kind: "blockquote"; lines: string[] }
    | { kind: "list"; ordered: boolean; rawItems: string[][] }
    | { kind: "hr" }
    | { kind: "math-block"; source: string }
    | { kind: "code-block"; lang: string | undefined; code: string }
    | { kind: "paragraph"; lines: string[] };

function tokenizeBlocks(lines: string[]): RawBlock[] {
    const blocks: RawBlock[] = [];
    let i = 0;

    while (i < lines.length) {
        const prevI = i;
        const line = lines[i];

        // Blank line
        if (line.trim() === "") {
            i++;
            continue;
        }

        // Fenced code block
        const fenceMatch = line.match(/^```(\w*)$/);
        if (fenceMatch) {
            const lang = fenceMatch[1] || undefined;
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && lines[i] !== "```") {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // consume closing ```
            log(`  block[${blocks.length}] code-block lang=${lang ?? "none"} (${codeLines.length} line(s))`);
            blocks.push({ kind: "code-block", lang, code: codeLines.join("\n") });
            continue;
        }

        // Block math: any line that starts with $$ opens a math block.
        // Handles three forms:
        //   1. Opening $$ alone:    $$\n...content...\n$$
        //   2. Opening $$ inline:   $$ content...\n...\ncontent $$
        //   3. Single-line:        $$ content $$
        if (line.trimStart().startsWith("$$")) {
            const afterOpen = line.trimStart().slice(2); // content after opening $$
            const mathLines: string[] = [];

            if (afterOpen.trimEnd().endsWith("$$")) {
                // Single-line block math: $$ source $$
                const source = afterOpen.trimEnd().slice(0, -2).trim();
                if (source) mathLines.push(source);
                i++;
            } else {
                if (afterOpen.trim()) mathLines.push(afterOpen);
                i++;
                while (i < lines.length) {
                    const ml = lines[i];
                    if (ml.trim() === "$$") {
                        i++;
                        break;
                    }
                    if (ml.trimEnd().endsWith("$$")) {
                        const tail = ml.trimEnd().slice(0, -2).trimEnd();
                        if (tail) mathLines.push(tail);
                        i++;
                        break;
                    }
                    mathLines.push(ml);
                    i++;
                }
            }

            log(`  block[${blocks.length}] math-block (${mathLines.length} line(s))`);
            blocks.push({ kind: "math-block", source: mathLines.join("\n") });
            continue;
        }

        // Horizontal rule (only standalone --- in content body)
        if (/^---+$/.test(line.trim())) {
            log(`  block[${blocks.length}] hr`);
            blocks.push({ kind: "hr" });
            i++;
            continue;
        }

        // Heading
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            log(`  block[${blocks.length}] heading h${headingMatch[1].length}: ${headingMatch[2].slice(0, 60)}`);
            blocks.push({ kind: "heading", level: headingMatch[1].length, text: headingMatch[2] });
            i++;
            continue;
        }

        // Blockquote
        if (line.startsWith("> ")) {
            const quoteLines: string[] = [];
            while (i < lines.length && lines[i].startsWith("> ")) {
                quoteLines.push(lines[i].slice(2));
                i++;
            }
            log(`  block[${blocks.length}] blockquote (${quoteLines.length} line(s))`);
            blocks.push({ kind: "blockquote", lines: quoteLines });
            continue;
        }

        // Unordered list
        if (/^- /.test(line)) {
            const rawItems: string[][] = [];
            while (i < lines.length) {
                const l = lines[i];
                if (/^- /.test(l)) {
                    rawItems.push([l.slice(2)]);
                    i++;
                } else if (rawItems.length > 0 && l.trim() !== "" && !/^(- |\d+\. |#{1,6} |> |```|-{3,}|\$\$)/.test(l)) {
                    // Continuation line for the last item
                    rawItems[rawItems.length - 1].push(l.trim());
                    i++;
                } else {
                    break;
                }
            }
            log(`  block[${blocks.length}] unordered-list (${rawItems.length} item(s))`);
            blocks.push({ kind: "list", ordered: false, rawItems });
            continue;
        }

        // Ordered list
        if (/^\d+\. /.test(line)) {
            const rawItems: string[][] = [];
            while (i < lines.length) {
                const l = lines[i];
                const ordMatch = l.match(/^\d+\. (.*)/);
                if (ordMatch) {
                    rawItems.push([ordMatch[1]]);
                    i++;
                } else if (rawItems.length > 0 && l.trim() !== "" && !/^(- |\d+\. |#{1,6} |> |```|-{3,}|\$\$)/.test(l)) {
                    rawItems[rawItems.length - 1].push(l.trim());
                    i++;
                } else {
                    break;
                }
            }
            log(`  block[${blocks.length}] ordered-list (${rawItems.length} item(s))`);
            blocks.push({ kind: "list", ordered: true, rawItems });
            continue;
        }

        // Paragraph — accumulate non-blank lines
        const paraLines: string[] = [];
        while (i < lines.length && lines[i].trim() !== "") {
            // Stop if we hit a block-level marker
            const l = lines[i];
            if (/^(#{1,6} |> |- |\d+\. |```|-{3,}|\$\$)/.test(l)) break;
            paraLines.push(l);
            i++;
        }
        if (paraLines.length > 0) {
            log(`  block[${blocks.length}] paragraph (${paraLines.length} line(s))`);
            blocks.push({ kind: "paragraph", lines: paraLines });
        }

        // Safety guard: if nothing advanced, skip the line to prevent an infinite loop.
        if (i === prevI) {
            log(`  WARNING: no block matched line ${i}: ${JSON.stringify(lines[i])} — skipping.`);
            i++;
        }
    }

    return blocks;
}

function buildBlockNodes(rawBlocks: RawBlock[]): BlockNode[] {
    return rawBlocks.map((raw): BlockNode => {
        switch (raw.kind) {
            case "heading":
                return {
                    type: "heading",
                    level: Math.min(6, Math.max(1, raw.level)) as HeadingNode["level"],
                    children: parseInline(raw.text),
                };

            case "paragraph":
                return {
                    type: "paragraph",
                    children: parseInline(raw.lines.join("\n")),
                };

            case "blockquote": {
                const inner = tokenizeBlocks(raw.lines);
                return {
                    type: "blockquote",
                    children: buildBlockNodes(inner),
                } as BlockquoteNode;
            }

            case "list": {
                const items: ListItem[] = raw.rawItems.map((lineGroup) => ({
                    children: parseInline(lineGroup.join(" ")),
                }));
                return { type: "list", ordered: raw.ordered, items } as ListNode;
            }

            case "hr":
                return { type: "hr" };

            case "math-block":
                return { type: "math-block", source: raw.source } as MathBlockNode;

            case "code-block":
                return { type: "code-block", lang: raw.lang, code: raw.code } as CodeBlockNode;
        }
    });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse raw markdown content into a ParseResult containing an AST and
 * structured metadata extracted from the trailing `---` block.
 */
export function parse(raw: string): ParseResult {
    log(`parse() called — input length: ${raw.length} char(s)`);

    // Normalise line endings
    const normalised = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // Split at the last occurrence of \n---\n (or \n--- at EOF)
    // The final `---` in a file is always the metadata separator.
    const metaSepRe = /\n---\n([\s\S]*)$/;
    const metaMatch = normalised.match(metaSepRe);

    let contentRaw: string;
    let metadataRaw: string;

    if (metaMatch) {
        contentRaw = normalised.slice(0, normalised.length - metaMatch[0].length);
        metadataRaw = metaMatch[1];
        log(`metadata block found (${metadataRaw.trim().split("\n").length} line(s))`);
    } else {
        contentRaw = normalised;
        metadataRaw = "";
        log("no metadata block found");
    }

    const metadata = parseMetadata(metadataRaw);
    const lines = contentRaw.split("\n");
    log(`tokenizing ${lines.length} content line(s)...`);
    const rawBlocks = tokenizeBlocks(lines);
    log(`tokenized into ${rawBlocks.length} block(s), building AST...`);
    const nodes = buildBlockNodes(rawBlocks);

    // Render the metadata section as part of the article too.
    // The `---` separator becomes an <hr>, followed by the parsed metadata lines.
    if (metadataRaw.trim()) {
        const metaLines = metadataRaw.split("\n");
        log(`tokenizing ${metaLines.length} metadata line(s) for rendering...`);
        const metaRawBlocks = tokenizeBlocks(metaLines);
        const metaNodes = buildBlockNodes(metaRawBlocks);
        nodes.push({ type: "hr" });
        nodes.push(...metaNodes);
        log(`appended hr + ${metaNodes.length} metadata node(s) to content`);
    }

    log(`parse() done — ${nodes.length} top-level node(s)`);

    return { nodes, metadata };
}
