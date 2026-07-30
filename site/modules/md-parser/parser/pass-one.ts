import log from '../../logger';
import profiler from '../../profiler';
import { parseInline } from './pass-two';
import { inlineToText } from '../utils';
import type {
    BlockNode,
    ParseResult,
    DiagnosticLog,
    DocumentMetadata,
    ListItemNode
} from '../types';

/**
 * Parses a raw markdown string into an array of BlockNodes.
 * Handles the recursive parsing of nested blocks like blockquotes.
 *
 * @param text - The raw markdown text to parse.
 * @param diagnostics - Mutable array to collect warnings and errors.
 * @returns Array of structured BlockNodes.
 */
function parseBlocks(text: string, diagnostics: DiagnosticLog[]): BlockNode[] {
    const lines = text.split(/\r?\n/);
    const ast: BlockNode[] = [];
    let i = 0;
    const len = lines.length;

    while (i < len) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed === '') {
            i++;
            continue;
        }

        // 1. Fenced Code Block
        if (trimmed.startsWith('```')) {
            const language = trimmed.slice(3).trim();
            const contentLines: string[] = [];
            i++;
            let closed = false;
            while (i < len) {
                if (lines[i].trim() === '```') {
                    closed = true;
                    i++;
                    break;
                }
                contentLines.push(lines[i]);
                i++;
            }
            if (!closed) {
                diagnostics.push({ level: 'warn', line: i, message: 'Unclosed fenced code block' });
                log.warn(`Unclosed fenced code block detected around line ${i}`);
            }
            ast.push({
                kind: 'block-code',
                language: language || undefined,
                value: contentLines.join('\n')
            });
            continue;
        }

        // 2. Display Math Block
        if (trimmed === '$$') {
            const contentLines: string[] = [];
            i++;
            let closed = false;
            while (i < len) {
                if (lines[i].trim() === '$$') {
                    closed = true;
                    i++;
                    break;
                }
                contentLines.push(lines[i]);
                i++;
            }
            if (!closed) {
                diagnostics.push({ level: 'warn', line: i, message: 'Unclosed display math block' });
                log.warn(`Unclosed display math block detected around line ${i}`);
            }
            ast.push({
                kind: 'block-math',
                value: contentLines.join('\n')
            });
            continue;
        }

        // 3. Headings (H1 to H4)
        const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
        if (headingMatch) {
            const level = headingMatch[1].length as 1 | 2 | 3 | 4;
            const content = headingMatch[2];
            ast.push({
                kind: 'block-heading',
                level,
                children: parseInline(content, diagnostics, i)
            });
            i++;
            continue;
        }

        // 4. Horizontal Rule
        if (trimmed === '---') {
            ast.push({ kind: 'block-hr' });
            i++;
            continue;
        }

        // 5. Blockquote
        if (line.startsWith('> ')) {
            const contentLines: string[] = [];
            while (i < len && lines[i].startsWith('> ')) {
                contentLines.push(lines[i].slice(2));
                i++;
            }
            // Recursively parse the blockquote contents
            ast.push({
                kind: 'block-quote',
                children: parseBlocks(contentLines.join('\n'), diagnostics)
            });
            continue;
        }

        // 6. Unordered List
        if (trimmed.match(/^[-+*]\s+(.*)$/)) {
            const items: ListItemNode[] = [];
            while (i < len) {
                const listMatch = lines[i].match(/^[-+*]\s+(.*)$/);
                if (listMatch) {
                    items.push({
                        kind: 'list-item',
                        children: parseInline(listMatch[1], diagnostics, i)
                    });
                    i++;
                } else {
                    break;
                }
            }
            ast.push({
                kind: 'block-list',
                ordered: false,
                items
            });
            continue;
        }

        // 7. Ordered List
        if (trimmed.match(/^\d+\.\s+(.*)$/)) {
            const items: ListItemNode[] = [];
            while (i < len) {
                const listMatch = lines[i].match(/^\d+\.\s+(.*)$/);
                if (listMatch) {
                    items.push({
                        kind: 'list-item',
                        children: parseInline(listMatch[1], diagnostics, i)
                    });
                    i++;
                } else {
                    break;
                }
            }
            ast.push({
                kind: 'block-list',
                ordered: true,
                items
            });
            continue;
        }

        // 8. Paragraph (Fallback)
        const contentLines: string[] = [];
        while (i < len) {
            const l = lines[i];
            const t = l.trim();
            // Break paragraph on empty line or start of other blocks
            if (
                t === '' ||
                t.startsWith('```') ||
                t === '$$' ||
                t.match(/^#{1,4}\s+/) ||
                t === '---' ||
                l.startsWith('> ') ||
                t.match(/^[-+*]\s+/) ||
                t.match(/^\d+\.\s+/)
            ) {
                break;
            }
            contentLines.push(l.trim());
            i++;
        }

        ast.push({
            kind: 'block-paragraph',
            children: parseInline(contentLines.join(' '), diagnostics, i - contentLines.length)
        });
    }

    return ast;
}

/**
 * Extracts metadata from the trailing list of the AST if present.
 * Looks for a sequence of [HorizontalRule, UnorderedList] at the end.
 *
 * @param ast - The mutable AST array to check and pop from.
 * @returns The extracted DocumentMetadata object.
 */
function extractMetadata(ast: BlockNode[]): DocumentMetadata {
    const meta: DocumentMetadata = {};

    if (ast.length >= 2) {
        const lastNode = ast[ast.length - 1];
        const secondLastNode = ast[ast.length - 2];

        if (secondLastNode.kind === 'block-hr' && lastNode.kind === 'block-list' && !lastNode.ordered) {
            lastNode.items.forEach((item) => {
                if (item.children.length > 0) {
                    const firstChild = item.children[0];
                    if (firstChild.kind === 'inline-strong') {
                        const key = inlineToText(firstChild.children).replace(':', '').trim().toLowerCase();
                        const val = inlineToText(item.children.slice(1)).replace(/^:\s*/, '').trim();

                        if (key === 'author') meta.author = val;
                        if (key === 'published') meta.published = val;
                        if (key === 'conceived') meta.conceived = val;
                    }
                }
            });

            // Format sortDate for routing sorting logic
            if (meta.published) {
                try {
                    const datePart = meta.published.split(',').slice(0, 2).join(',').trim();
                    const d = new Date(datePart);
                    if (!isNaN(d.getTime())) {
                        meta.sortDate = d.toISOString().split('T')[0];
                    }
                } catch (e) {
                    // Ignore date parsing failures
                }
            }

            // Remove metadata footprint from rendered AST
            // ast.pop(); // Remove list
            // ast.pop(); // Remove HR
        }
    }

    return meta;
}

/**
 * Main entry point for the custom Two-Pass Markdown Parser.
 * Tokenizes raw text into a strict TypeScript AST.
 *
 * @param text - Raw markdown string input.
 * @returns Object containing the AST, extracted metadata, and diagnostics.
 * @example
 * import { parseMarkdown } from 'modules/md-parser';
 *
 * const result = parseMarkdown('# Hello World');
 * console.log(result.ast[0]); // HeadingBlockNode
 */
export function parseMarkdown(text: string): ParseResult {
    profiler.time('md-parse');
    log.debug('Starting two-pass markdown parser execution...');

    const diagnostics: DiagnosticLog[] = [];
    const ast = parseBlocks(text, diagnostics);
    const metadata = extractMetadata(ast);

    const duration = profiler.timeEnd('md-parse', 'Markdown parsed in');
    if (diagnostics.length > 0) {
        log.warn(`Parsed with ${diagnostics.length} diagnostic warnings (took ${duration?.toFixed(2)}ms).`);
    } else {
        log.info(`Parsed successfully with 0 warnings (took ${duration?.toFixed(2)}ms).`);
    }

    return { ast, metadata, diagnostics };
}
