import { Logger } from "../logger";
import {
    MDNodeType,
    MDBlockquoteType,
    MDListOrderingType,
} from "./types";
import type {
    InlineNode,
    BlockNode,
    TextNode,
    HeadingNode,
    ParagraphNode,
    BlockquoteNode,
    ListNode,
    ListItemNode,
    BlockCodeNode,
    BlockMathNode,
    MDMetadata,
    MDParseResult,
} from "./types";
import { inlineToText } from "./utils";

// Initialize logger
const log = new Logger("module:md-parser");

/**
 * A character-by-character scanner for tracking parsing position.
 */
class StringScanner {
    private src: string;
    private pos: number;
    private len: number;

    /**
     * Creates a new StringScanner instance.
     *
     * @param src - The source string to scan.
     * @param startPos - The initial position to start scanning.
     */
    constructor(src: string, startPos = 0) {
        this.src = src;
        this.pos = startPos;
        this.len = src.length;
    }

    /**
     * Gets the current position of the scanner cursor.
     */
    public getPos(): number {
        return this.pos;
    }

    /**
     * Sets the scanner position cursor.
     */
    public setPos(pos: number): void {
        this.pos = pos;
    }

    /**
     * Returns the character at the current cursor position, or empty string if EOF.
     */
    public peek(): string {
        if (this.pos >= this.len) {
            return "";
        }
        return this.src[this.pos];
    }

    /**
     * Peeks at a substring of length n from current position.
     */
    public peekStr(n: number): string {
        if (this.pos >= this.len) {
            return "";
        }
        return this.src.substring(this.pos, this.pos + n);
    }

    /**
     * Consumes and returns the character at the current position.
     */
    public next(): string {
        if (this.pos >= this.len) {
            return "";
        }
        const char = this.src[this.pos];
        this.pos++;
        return char;
    }

    /**
     * Checks if the upcoming characters match expected string.
     * If matched, consumes the string and returns true.
     */
    public match(expected: string): boolean {
        if (this.src.startsWith(expected, this.pos)) {
            this.pos += expected.length;
            return true;
        }
        return false;
    }

    /**
     * Consumes characters as long as the predicate function returns true.
     */
    public consumeWhile(predicate: (char: string) => boolean): string {
        let result = "";
        while (this.pos < this.len && predicate(this.src[this.pos])) {
            result += this.src[this.pos];
            this.pos++;
        }
        return result;
    }

    /**
     * Returns whether the scanner has reached the end of the input source.
     */
    public isEOF(): boolean {
        return this.pos >= this.len;
    }
}

/**
 * Handles inline-level markdown parsing systematically using a scanner.
 */
class InlineParser {
    /**
     * Parses a string segment into a strictly typed array of InlineNodes.
     *
     * @param input - The raw text segment.
     * @returns Parsed InlineNode array.
     */
    public static parse(input: string): InlineNode[] {
        log.info(`InlineParser: Beginning inline scan of length ${input.length}`);
        const scanner = new StringScanner(input);
        const nodes: InlineNode[] = [];

        while (!scanner.isEOF()) {
            const startPos = scanner.getPos();

            // Line break: \ followed by \n
            if (scanner.match("\\\n")) {
                log.info(`InlineParser: Matched forced LineBreak at position ${startPos}`);
                nodes.push({ type: MDNodeType.lineBreak });
                continue;
            }

            // Bold: **
            if (scanner.match("**")) {
                log.info(`InlineParser: Scanning bold syntax starting at position ${startPos}`);
                const closingIndex = input.indexOf("**", scanner.getPos());
                if (closingIndex !== -1) {
                    const contentStr = input.slice(scanner.getPos(), closingIndex);
                    scanner.setPos(closingIndex + 2);
                    log.info(`InlineParser: Found closing bold tag at position ${closingIndex}`);
                    nodes.push({
                        type: MDNodeType.bold,
                        contents: InlineParser.parse(contentStr),
                    });
                } else {
                    log.warn(`InlineParser: Unclosed bold tag at position ${startPos}. Falling back to literal text.`);
                    nodes.push({ type: MDNodeType.text, content: "**" });
                }
                continue;
            }

            // Italic: *
            if (scanner.match("*")) {
                log.info(`InlineParser: Scanning italic syntax starting at position ${startPos}`);
                const closingIndex = input.indexOf("*", scanner.getPos());
                if (closingIndex !== -1) {
                    const contentStr = input.slice(scanner.getPos(), closingIndex);
                    scanner.setPos(closingIndex + 1);
                    log.info(`InlineParser: Found closing italic tag at position ${closingIndex}`);
                    nodes.push({
                        type: MDNodeType.italic,
                        contents: InlineParser.parse(contentStr),
                    });
                } else {
                    log.warn(`InlineParser: Unclosed italic tag at position ${startPos}. Falling back to literal text.`);
                    nodes.push({ type: MDNodeType.text, content: "*" });
                }
                continue;
            }

            // Inline Code: `
            if (scanner.match("`")) {
                log.info(`InlineParser: Scanning inline code syntax starting at position ${startPos}`);
                const closingIndex = input.indexOf("`", scanner.getPos());
                if (closingIndex !== -1) {
                    const contentStr = input.slice(scanner.getPos(), closingIndex);
                    scanner.setPos(closingIndex + 1);
                    log.info(`InlineParser: Found closing code backtick at position ${closingIndex}`);
                    nodes.push({
                        type: MDNodeType.inlineCode,
                        content: contentStr,
                    });
                } else {
                    log.warn(`InlineParser: Unclosed inline code tag at position ${startPos}. Falling back to literal text.`);
                    nodes.push({ type: MDNodeType.text, content: "`" });
                }
                continue;
            }

            // Inline Math: $
            if (scanner.match("$")) {
                log.info(`InlineParser: Scanning inline math syntax starting at position ${startPos}`);
                const closingIndex = input.indexOf("$", scanner.getPos());
                if (closingIndex !== -1) {
                    const contentStr = input.slice(scanner.getPos(), closingIndex);
                    scanner.setPos(closingIndex + 1);
                    log.info(`InlineParser: Found closing math tag at position ${closingIndex}`);
                    nodes.push({
                        type: MDNodeType.inlineMath,
                        content: contentStr,
                    });
                } else {
                    log.warn(`InlineParser: Unclosed inline math tag at position ${startPos}. Falling back to literal text.`);
                    nodes.push({ type: MDNodeType.text, content: "$" });
                }
                continue;
            }

            // Superscript: ^
            if (scanner.match("^")) {
                log.info(`InlineParser: Scanning superscript syntax starting at position ${startPos}`);
                const closingIndex = input.indexOf("^", scanner.getPos());
                if (closingIndex !== -1) {
                    const contentStr = input.slice(scanner.getPos(), closingIndex);
                    scanner.setPos(closingIndex + 1);
                    log.info(`InlineParser: Found closing superscript tag at position ${closingIndex}`);
                    nodes.push({
                        type: MDNodeType.superScript,
                        contents: InlineParser.parse(contentStr),
                    });
                } else {
                    log.warn(`InlineParser: Unclosed superscript tag at position ${startPos}. Falling back to literal text.`);
                    nodes.push({ type: MDNodeType.text, content: "^" });
                }
                continue;
            }

            // Subscript: ~
            if (scanner.match("~")) {
                log.info(`InlineParser: Scanning subscript syntax starting at position ${startPos}`);
                const closingIndex = input.indexOf("~", scanner.getPos());
                if (closingIndex !== -1) {
                    const contentStr = input.slice(scanner.getPos(), closingIndex);
                    scanner.setPos(closingIndex + 1);
                    log.info(`InlineParser: Found closing subscript tag at position ${closingIndex}`);
                    nodes.push({
                        type: MDNodeType.subScript,
                        contents: InlineParser.parse(contentStr),
                    });
                } else {
                    log.warn(`InlineParser: Unclosed subscript tag at position ${startPos}. Falling back to literal text.`);
                    nodes.push({ type: MDNodeType.text, content: "~" });
                }
                continue;
            }

            // Link: [text](url)
            if (scanner.match("[")) {
                log.info(`InlineParser: Scanning link syntax starting at position ${startPos}`);
                const bracketClose = input.indexOf("]", scanner.getPos());
                if (bracketClose !== -1 && input.startsWith("(", bracketClose + 1)) {
                    const parenClose = input.indexOf(")", bracketClose + 2);
                    if (parenClose !== -1) {
                        const textStr = input.slice(scanner.getPos(), bracketClose);
                        const href = input.slice(bracketClose + 2, parenClose);
                        scanner.setPos(parenClose + 1);
                        log.info(`InlineParser: Found link href "${href}" ending at position ${parenClose}`);
                        nodes.push({
                            type: MDNodeType.link,
                            href,
                            contents: InlineParser.parse(textStr),
                        });
                        continue;
                    }
                }
                log.warn(`InlineParser: Unclosed or malformed link brackets starting at position ${startPos}. Falling back to literal text.`);
                nodes.push({ type: MDNodeType.text, content: "[" });
                continue;
            }

            // Literal text consumption
            const textStr = scanner.consumeWhile(
                (char) => !["*", "`", "$", "^", "~", "[", "\\"].includes(char)
            );
            if (textStr.length > 0) {
                nodes.push({
                    type: MDNodeType.text,
                    content: textStr,
                });
            } else {
                // If scanner gets stuck, consume one character as literal text
                const stuckChar = scanner.next();
                if (stuckChar) {
                    nodes.push({
                        type: MDNodeType.text,
                        content: stuckChar,
                    });
                }
            }
        }

        // Simplify nodes: Coalesce contiguous text nodes
        const optimized: InlineNode[] = [];
        for (const node of nodes) {
            if (node.type === MDNodeType.text) {
                const last = optimized[optimized.length - 1];
                if (last && last.type === MDNodeType.text) {
                    (last as TextNode).content += (node as TextNode).content;
                    continue;
                }
            }
            optimized.push(node);
        }

        return optimized;
    }
}

/**
 * Handles block-level markdown parsing systematically line-by-line.
 */
class BlockParser {
    /**
     * Parses raw markdown text into structural BlockNodes.
     *
     * @param input - The raw document text.
     * @returns BlockNode array representing document structure.
     */
    public static parse(input: string): BlockNode[] {
        log.info(`BlockParser: Beginning block parse of length ${input.length} characters`);
        const blocks: BlockNode[] = [];
        const lines = input.split(/\r?\n/);
        const totalLines = lines.length;
        let cursor = 0;

        while (cursor < totalLines) {
            const rawLine = lines[cursor];
            const trimmedLine = rawLine.trim();

            // Skip empty lines
            if (trimmedLine.length === 0) {
                cursor++;
                continue;
            }

            // 1. BlockCode block: ```
            if (trimmedLine.startsWith("```")) {
                const startLine = cursor;
                const lang = trimmedLine.slice(3).trim() || undefined;
                log.info(`BlockParser: Processing CodeBlock [${lang ?? "no language"}] starting on line ${startLine + 1}`);

                const contentLines: string[] = [];
                cursor++;
                let foundClosing = false;

                while (cursor < totalLines) {
                    if (lines[cursor].trim() === "```") {
                        foundClosing = true;
                        break;
                    }
                    contentLines.push(lines[cursor]);
                    cursor++;
                }

                if (!foundClosing) {
                    log.warn(`BlockParser: CodeBlock starting on line ${startLine + 1} was never closed. Parsing until EOF.`);
                } else {
                    log.info(`BlockParser: Closed CodeBlock starting on line ${startLine + 1} at line ${cursor + 1}`);
                }

                blocks.push({
                    type: MDNodeType.blockCode,
                    lang,
                    content: contentLines.join("\n"),
                });
                cursor++; // skip closing ```
                continue;
            }

            // 2. BlockMath block: $$
            if (trimmedLine.startsWith("$$")) {
                const startLine = cursor;
                log.info(`BlockParser: Processing MathBlock starting on line ${startLine + 1}`);

                const contentLines: string[] = [];
                cursor++;
                let foundClosing = false;

                while (cursor < totalLines) {
                    if (lines[cursor].trim() === "$$") {
                        foundClosing = true;
                        break;
                    }
                    contentLines.push(lines[cursor]);
                    cursor++;
                }

                if (!foundClosing) {
                    log.warn(`BlockParser: MathBlock starting on line ${startLine + 1} was never closed. Parsing until EOF.`);
                } else {
                    log.info(`BlockParser: Closed MathBlock starting on line ${startLine + 1} at line ${cursor + 1}`);
                }

                blocks.push({
                    type: MDNodeType.blockMath,
                    content: contentLines.join("\n"),
                });
                cursor++; // skip closing $$
                continue;
            }

            // 3. Blockquote block: >
            if (trimmedLine.startsWith(">")) {
                const startLine = cursor;
                log.info(`BlockParser: Processing Blockquote starting on line ${startLine + 1}`);

                const quoteLines: string[] = [];
                while (cursor < totalLines) {
                    const currentLine = lines[cursor].trim();
                    if (!currentLine.startsWith(">")) {
                        break;
                    }
                    let content = currentLine.slice(1);
                    if (content.startsWith(" ")) {
                        content = content.slice(1);
                    }
                    quoteLines.push(content);
                    cursor++;
                }

                const subContent = quoteLines.join("\n");
                blocks.push({
                    type: MDNodeType.blockquote,
                    severity: MDBlockquoteType.default,
                    children: BlockParser.parse(subContent),
                });
                log.info(`BlockParser: Finished Blockquote starting on line ${startLine + 1} (lines processed: ${cursor - startLine})`);
                continue;
            }

            // 4. Horizontal Rule divider: --- or ***
            if (trimmedLine === "---" || trimmedLine === "***") {
                log.info(`BlockParser: Processing HorizontalRule on line ${cursor + 1}`);
                blocks.push({
                    type: MDNodeType.horizontalRule,
                });
                cursor++;
                continue;
            }

            // 5. List items: - , + , * , or \d+\.
            const isUnordered = trimmedLine.startsWith("- ") || trimmedLine.startsWith("+ ") || trimmedLine.startsWith("* ");
            const isOrdered = /^\d+\.\s/.test(trimmedLine);
            if (isUnordered || isOrdered) {
                const startLine = cursor;
                log.info(`BlockParser: Processing List structure starting on line ${startLine + 1}`);
                const items: ListItemNode[] = [];
                let ordering: MDListOrderingType = MDListOrderingType.hyphen;

                if (trimmedLine.startsWith("+ ")) {
                    ordering = MDListOrderingType.plus;
                } else if (trimmedLine.startsWith("* ")) {
                    ordering = MDListOrderingType.asterisk;
                } else if (isOrdered) {
                    ordering = MDListOrderingType.oneTwoThree;
                }

                while (cursor < totalLines) {
                    const currentTrimmed = lines[cursor].trim();

                    const itemUnordered = currentTrimmed.startsWith("- ") || currentTrimmed.startsWith("+ ") || currentTrimmed.startsWith("* ");
                    const itemOrdered = /^\d+\.\s/.test(currentTrimmed);

                    if (!itemUnordered && !itemOrdered) {
                        // Check if the line triggers other block structures
                        if (
                            currentTrimmed.startsWith("```") ||
                            currentTrimmed.startsWith("$$") ||
                            currentTrimmed.startsWith(">") ||
                            currentTrimmed === "---" ||
                            currentTrimmed === "***" ||
                            currentTrimmed.startsWith("- ") ||
                            currentTrimmed.startsWith("+ ") ||
                            currentTrimmed.startsWith("* ") ||
                            /^\d+\.\s/.test(currentTrimmed) ||
                            (currentTrimmed.startsWith("#") && /^[#]+\s/.test(currentTrimmed))
                        ) {
                            break;
                        }

                        // Check if the line is empty or newline
                        if (currentTrimmed === "" || currentTrimmed === "\n") {
                            // If next line is list-item, ignore this empty line
                            // Else close list structure
                            if (cursor === totalLines - 1) {
                                break;
                            }

                            const nextLine = lines[cursor + 1];
                            const nextTrimmed = nextLine.trim();
                            const nextItemUnordered = nextTrimmed.startsWith("- ") || nextTrimmed.startsWith("+ ") || nextTrimmed.startsWith("* ");
                            const nextItemOrdered = /^\d+\.\s/.test(nextTrimmed);
                            if (nextItemUnordered || nextItemOrdered) {
                                log.info(`BlockParser: Consuming empty line on line ${cursor + 1} as next line is list-item`);
                                items[items.length - 1].contents.push(...InlineParser.parse(currentTrimmed));
                                cursor++;
                                continue;
                            }
                            break;
                        }

                        // Current line is continuous, so part of same list item
                        log.info(`BlockParser: Continuous multi-line list item on line ${cursor + 1}`)
                        if (items.length > 0) {
                            items[items.length - 1].contents.push(...InlineParser.parse(currentTrimmed));
                            cursor++;
                            continue;
                        }

                        break;
                    }

                    let content = "";
                    if (itemUnordered) {
                        content = currentTrimmed.slice(2);
                    } else if (itemOrdered) {
                        content = currentTrimmed.replace(/^\d+\.\s/, "");
                    }

                    log.info(`BlockParser: Scanning list item content on line ${cursor + 1}`);
                    items.push({
                        type: MDNodeType.listItem,
                        contents: InlineParser.parse(content),
                    });
                    cursor++;
                }

                blocks.push({
                    type: MDNodeType.list,
                    ordering,
                    children: items,
                });
                log.info(`BlockParser: Finished List starting on line ${startLine + 1} with ${items.length} items`);
                continue;
            }

            // 6. Heading: # to ######
            if (trimmedLine.startsWith("#")) {
                let level = 0;
                while (level < trimmedLine.length && trimmedLine[level] === "#") {
                    level++;
                }
                const hasSpace = level < trimmedLine.length && trimmedLine[level] === " ";
                if (level >= 1 && level <= 6 && hasSpace) {
                    log.info(`BlockParser: Processing Heading level ${level} on line ${cursor + 1}`);
                    const headingContent = trimmedLine.slice(level + 1);
                    blocks.push({
                        type: MDNodeType.heading,
                        level: level as 1 | 2 | 3 | 4 | 5 | 6,
                        children: InlineParser.parse(headingContent),
                    });
                    cursor++;
                    continue;
                }
            }

            // 7. Paragraph fallback
            const startLine = cursor;
            log.info(`BlockParser: Processing Paragraph starting on line ${startLine + 1}`);
            const paragraphLines: string[] = [];

            while (cursor < totalLines) {
                const currentLine = lines[cursor].trim();
                if (currentLine.length === 0) {
                    break;
                }
                // Check if the line triggers other block structures
                if (
                    currentLine.startsWith("```") ||
                    currentLine.startsWith("$$") ||
                    currentLine.startsWith(">") ||
                    currentLine === "---" ||
                    currentLine === "***" ||
                    currentLine.startsWith("- ") ||
                    currentLine.startsWith("+ ") ||
                    currentLine.startsWith("* ") ||
                    /^\d+\.\s/.test(currentLine) ||
                    (currentLine.startsWith("#") && /^[#]+\s/.test(currentLine))
                ) {
                    break;
                }
                paragraphLines.push(lines[cursor]);
                cursor++;
            }

            const fullText = paragraphLines.join(" ");
            blocks.push({
                type: MDNodeType.paragraph,
                children: InlineParser.parse(fullText),
            });
            log.info(`BlockParser: Finished Paragraph starting on line ${startLine + 1}`);
        }

        return blocks;
    }
}

/**
 * Searches the parsed blocks (typically checking list nodes at the end)
 * to extract publication/author metadata fields from the markdown.
 *
 * @param blocks - The parsed list of BlockNodes.
 * @returns An extracted MDMetadata structure.
 */
function extractMetadata(blocks: BlockNode[]): MDMetadata {
    const metadata: MDMetadata = {};

    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        if (block.type === MDNodeType.list) {
            const listNode = block as ListNode;
            let author: string | undefined;
            let published: string | undefined;
            let conceived: string | undefined;

            for (const item of listNode.children) {
                const text = inlineToText(item.contents).trim();
                const authorMatch = text.match(/^Author:\s*(.+)$/i);
                const publishedMatch = text.match(/^Published:\s*(.+)$/i);
                const conceivedMatch = text.match(/^Conceived:\s*(.+)$/i);

                if (authorMatch) {
                    author = authorMatch[1].trim();
                }
                if (publishedMatch) {
                    published = publishedMatch[1].trim();
                }
                if (conceivedMatch) {
                    conceived = conceivedMatch[1].trim();
                }
            }

            if (author || published || conceived) {
                log.info("extractMetadata: Successfully identified metadata block", {
                    author,
                    published,
                    conceived,
                });
                metadata.publication = {
                    author: author ?? "",
                    published: published ?? "",
                    conceived: conceived ?? "",
                };
                break;
            }
        }
    }

    return metadata;
}

/**
 * Main entry point for Markdown parsing.
 *
 * @param raw - The raw markdown input string.
 * @returns A result object containing the parsed AST blocks and metadata.
 */
export function parse(raw: string): MDParseResult {
    log.info(`MarkdownParser: Processing document (size: ${raw.length} bytes)`);
    try {
        const children = BlockParser.parse(raw);
        const metadata = extractMetadata(children);
        return {
            children,
            metadata,
        };
    } catch (e) {
        log.error("MarkdownParser: Fatal exception encountered during compilation", { error: e });
        throw e;
    }
}
