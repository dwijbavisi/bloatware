import { Logger, LogLevel } from "../logger";

import { MDNodeType, MDBlockquoteType, MDListOrderingType } from "./types";
import type {
    InlineNode,
    BlockNode,
    // Inline nodes
    TextNode,
    BoldNode,
    ItalicNode,
    LinkNode,
    InlineCodeNode,
    InlineMathNode,
    SuperScriptNode,
    SubScriptNode,
    BrNode,
    // Block nodes
    HeadingNode,
    ParagraphNode,
    BlockquoteNode,
    ListNode,
    ListItemNode,
    BlockCodeNode,
    BlockMathNode,
    HrNode,
    // Metadata
    MDMetadata,
    MDParseResult,
} from "./types";

// -----------------------------------------------------------------------------
// Logger instance

const log = new Logger('module:md', { level: LogLevel.debug });

// -----------------------------------------------------------------------------
// Paser

/**
 * Handles inline-level markdown parsing.
 * Provides explicit, dedicated methods for every inline node type.
 */
class InlineParser {
    /**
     * Parses a segment of text into a list of InlineNodes.
     * @param input Raw document string.
     * @param start Starting character index.
     * @param limit Ending character index.
     * @returns A tuple containing the parsed nodes and the last consumed index.
     */
    public static parse(input: string, start: number, limit: number): [InlineNode[], number] {
        const nodes: InlineNode[] = [];
        let cursor = start;

        while (cursor < limit) {
            if (input.startsWith('\\\n', cursor)) {
                const [node, next] = this.consumeBr(input, cursor);
                nodes.push(node); cursor = next;
            } else if (input.startsWith('**', cursor)) {
                const [node, next] = this.consumeBold(input, cursor, limit);
                nodes.push(node); cursor = next;
            } else if (input[cursor] === '*') {
                const [node, next] = this.consumeItalic(input, cursor, limit);
                nodes.push(node); cursor = next;
            } else if (input[cursor] === '[') {
                const [node, next] = this.consumeLink(input, cursor, limit);
                nodes.push(node); cursor = next;
            } else if (input[cursor] === '`') {
                const [node, next] = this.consumeInlineCode(input, cursor, limit);
                nodes.push(node); cursor = next;
            } else if (input[cursor] === '$') {
                const [node, next] = this.consumeInlineMath(input, cursor, limit);
                nodes.push(node); cursor = next;
            } else if (input[cursor] === '^') {
                const [node, next] = this.consumeSuperScript(input, cursor, limit);
                nodes.push(node); cursor = next;
            } else if (input[cursor] === '~') {
                const [node, next] = this.consumeSubScript(input, cursor, limit);
                nodes.push(node); cursor = next;
            } else {
                const [node, next] = this.consumeText(input, cursor, limit);
                nodes.push(node); cursor = next;
            }
        }
        return [nodes, cursor];
    }

    private static consumeBr(input: string, cursor: number): [BrNode, number] {
        log.debug("Consuming BrNode");
        return [{ type: MDNodeType.lineBreak }, cursor + 2];
    }

    private static consumeBold(input: string, cursor: number, limit: number): [BoldNode, number] {
        const end = input.indexOf('**', cursor + 2);
        if (end === -1 || end >= limit) throw new Error("Unclosed bold tag");
        const [contents] = this.parse(input, cursor + 2, end);
        log.debug("Consuming BoldNode");
        return [{ type: MDNodeType.bold, contents }, end + 2];
    }

    private static consumeItalic(input: string, cursor: number, limit: number): [ItalicNode, number] {
        const end = input.indexOf('*', cursor + 1);
        if (end === -1 || end >= limit) throw new Error("Unclosed italic tag");
        const [contents] = this.parse(input, cursor + 1, end);
        log.debug("Consuming ItalicNode");
        return [{ type: MDNodeType.italic, contents }, end + 1];
    }

    private static consumeLink(input: string, cursor: number, limit: number): [LinkNode, number] {
        const bracketClose = input.indexOf(']', cursor + 1);
        const parenClose = input.indexOf(')', bracketClose + 2);
        if (bracketClose === -1 || parenClose === -1 || parenClose >= limit) throw new Error("Malformed link");
        const [contents] = this.parse(input, cursor + 1, bracketClose);
        const href = input.slice(bracketClose + 2, parenClose);
        log.debug("Consuming LinkNode");
        return [{ type: MDNodeType.link, href, contents }, parenClose + 1];
    }

    private static consumeInlineCode(input: string, cursor: number, limit: number): [InlineCodeNode, number] {
        const end = input.indexOf('`', cursor + 1);
        if (end === -1 || end >= limit) throw new Error("Unclosed inline code");
        log.debug("Consuming InlineCodeNode");
        return [{ type: MDNodeType.inlineCode, content: input.slice(cursor + 1, end) }, end + 1];
    }

    private static consumeInlineMath(input: string, cursor: number, limit: number): [InlineMathNode, number] {
        const end = input.indexOf('$', cursor + 1);
        if (end === -1 || end >= limit) throw new Error("Unclosed inline math");
        log.debug("Consuming InlineMathNode");
        return [{ type: MDNodeType.inlineMath, content: input.slice(cursor + 1, end) }, end + 1];
    }

    private static consumeSuperScript(input: string, cursor: number, limit: number): [SuperScriptNode, number] {
        const end = input.indexOf('^', cursor + 1);
        if (end === -1 || end >= limit) throw new Error("Unclosed superscript");
        const [contents] = this.parse(input, cursor + 1, end);
        log.debug("Consuming SuperScriptNode");
        return [{ type: MDNodeType.superScript, contents }, end + 1];
    }

    private static consumeSubScript(input: string, cursor: number, limit: number): [SubScriptNode, number] {
        const end = input.indexOf('~', cursor + 1);
        if (end === -1 || end >= limit) throw new Error("Unclosed subscript");
        const [contents] = this.parse(input, cursor + 1, end);
        log.debug("Consuming SubScriptNode");
        return [{ type: MDNodeType.subScript, contents }, end + 1];
    }

    private static consumeText(input: string, cursor: number, limit: number): [TextNode, number] {
        const specials = /[\$`*\[^~\\\n]/;
        let end = cursor;
        while (end < limit && !specials.test(input[end])) end++;
        log.debug("Consuming TextNode");
        return [{ type: MDNodeType.text, content: input.slice(cursor, end) }, end];
    }
}

/**
 * Handles block-level markdown parsing.
 * Provides explicit, dedicated methods for every block node type.
 */
class BlockParser {
    public static parse(input: string): BlockNode[] {
        const blocks: BlockNode[] = [];
        let cursor = 0;
        while (cursor < input.length) {
            let lineEnd = input.indexOf('\n', cursor);
            if (lineEnd === -1) lineEnd = input.length;
            const line = input.slice(cursor, lineEnd).trim();
            if (line.length === 0) { cursor = lineEnd + 1; continue; }

            const [node, next] = this.consumeBlock(input, cursor, lineEnd);
            blocks.push(node);
            cursor = next;
        }
        return blocks;
    }

    private static consumeBlock(input: string, start: number, lineEnd: number): [BlockNode, number] {
        const line = input.slice(start, lineEnd).trim();
        if (line.startsWith('```')) return this.consumeBlockCode(input, start, lineEnd);
        if (line.startsWith('$$')) return this.consumeBlockMath(input, start, lineEnd);
        if (line.startsWith('> ')) return this.consumeBlockquote(input, start);
        if (line.startsWith('- ') || line.startsWith('+ ') || line.startsWith('* ') || /^\d+\./.test(line)) return this.consumeList(input, start);
        if (line.startsWith('---') || line.startsWith('***')) return this.consumeHr(input, start, lineEnd);
        if (line.startsWith('#')) return this.consumeHeading(input, start, lineEnd);
        return this.consumeParagraph(input, start, lineEnd);
    }

    private static consumeBlockCode(input: string, start: number, lineEnd: number): [BlockCodeNode, number] {
        const line = input.slice(start, lineEnd).trim();
        const lang = line.slice(3).trim() || undefined;
        const end = input.indexOf('```', lineEnd + 1);
        if (end === -1) throw new Error("Unclosed code block");
        log.debug("Consuming BlockCodeNode");
        return [{ type: MDNodeType.blockCode, lang, content: input.slice(lineEnd + 1, end).trim() }, end + 3];
    }

    private static consumeBlockMath(input: string, start: number, lineEnd: number): [BlockMathNode, number] {
        const end = input.indexOf('$$', lineEnd + 1);
        if (end === -1) throw new Error("Unclosed math block");
        log.debug("Consuming BlockMathNode");
        return [{ type: MDNodeType.blockMath, content: input.slice(lineEnd + 1, end).trim() }, end + 2];
    }

    private static consumeBlockquote(input: string, start: number): [BlockquoteNode, number] {
        log.debug("Consuming BlockquoteNode");
        let cursor = start;
        let content = "";
        while (cursor < input.length) {
            let lineEnd = input.indexOf('\n', cursor);
            if (lineEnd === -1) lineEnd = input.length;
            const line = input.slice(cursor, lineEnd);
            if (!line.trim().startsWith('> ')) break;
            content += line.trim().slice(2) + '\n';
            cursor = lineEnd + 1;
        }
        return [{ type: MDNodeType.blockquote, severity: MDBlockquoteType.default, children: this.parse(content.trim()) }, cursor];
    }

    private static consumeList(input: string, start: number): [ListNode, number] {
        log.debug("Consuming ListNode");
        let cursor = start;
        const items: ListItemNode[] = [];
        const firstLine = input.slice(start, input.indexOf('\n', start) === -1 ? input.length : input.indexOf('\n', start)).trim();
        let ordering = MDListOrderingType.hyphen;
        if (firstLine.startsWith('+ ')) ordering = MDListOrderingType.plus;
        else if (firstLine.startsWith('* ')) ordering = MDListOrderingType.asterisk;
        else if (/^\d+\./.test(firstLine)) ordering = MDListOrderingType.oneTwoThree;

        while (cursor < input.length) {
            let lineEnd = input.indexOf('\n', cursor);
            if (lineEnd === -1) lineEnd = input.length;
            const line = input.slice(cursor, lineEnd).trim();
            if (!line.startsWith('- ') && !line.startsWith('+ ') && !line.startsWith('* ') && !/^\d+\./.test(line)) break;
            const content = line.replace(/^(-\s|\+\s|\*\s|\d+\.\s)/, "");
            const [children] = InlineParser.parse(content, 0, content.length);
            items.push({ type: MDNodeType.listItem, contents: children });
            cursor = lineEnd + 1;
        }
        return [{ type: MDNodeType.list, ordering, children: items }, cursor];
    }

    private static consumeHr(input: string, start: number, lineEnd: number): [HrNode, number] {
        log.debug("Consuming HrNode");
        return [{ type: MDNodeType.horizontalRule }, lineEnd + 1];
    }

    private static consumeHeading(input: string, start: number, lineEnd: number): [HeadingNode, number] {
        const line = input.slice(start, lineEnd);
        let level = 0;
        while (level < line.length && line[level] === '#') level++;
        const [children] = InlineParser.parse(input, start + level + 1, lineEnd);
        log.debug("Consuming HeadingNode");
        switch (level) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
                return [{ type: MDNodeType.heading, level: level, children }, lineEnd + 1];
            default:
                throw new Error("Invalid heading level")
        }
    }

    private static consumeParagraph(input: string, start: number, lineEnd: number): [ParagraphNode, number] {
        const [children] = InlineParser.parse(input, start, lineEnd);
        log.debug("Consuming ParagraphNode");
        return [{ type: MDNodeType.paragraph, children }, lineEnd + 1];
    }
}

// -----------------------------------------------------------------------------
// Main

/**
 * Main entry point for Markdown parsing.
 *
 * @param raw - The raw markdown input string.
 * @returns A result object containing the parsed AST and metadata.
 */
export function parse(raw: string): MDParseResult {
    log.info(`MarkdownParser: processing document (size: ${raw.length} bytes)`);
    try {
        return {
            children: BlockParser.parse(raw),
            metadata: {}
        };
    } catch (e) {
        log.error("MarkdownParser: fatal error encountered", { error: e });
        throw e;
    }
}
