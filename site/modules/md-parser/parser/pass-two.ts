import { escapeHtml } from '../utils';
import type { InlineNode, DiagnosticLog } from '../types';

/**
 * Checks whether a substring contains an unclosed italic delimiter ('*').
 * Accurately skips escaped characters, inline code, inline math, and bold pairs ('**').
 */
function hasUnclosedItalic(text: string): boolean {
    let inItalic = false;
    let i = 0;
    const len = text.length;

    while (i < len) {
        if (text[i] === '\\') {
            i += 2;
            continue;
        }
        if (text[i] === '`') {
            const end = text.indexOf('`', i + 1);
            i = end === -1 ? len : end + 1;
            continue;
        }
        if (text[i] === '$') {
            const end = text.indexOf('$', i + 1);
            i = end === -1 ? len : end + 1;
            continue;
        }
        if (text[i] === '*') {
            if (i + 1 < len && text[i + 1] === '*') {
                if (i + 2 < len && text[i + 2] === '*') {
                    inItalic = !inItalic;
                    i += 3;
                } else {
                    i += 2;
                }
                continue;
            }
            inItalic = !inItalic;
            i++;
            continue;
        }
        i++;
    }

    return inItalic;
}

/**
 * Checks whether a substring contains an unclosed bold delimiter ('**').
 */
function hasUnclosedBold(text: string): boolean {
    let inBold = false;
    let i = 0;
    const len = text.length;

    while (i < len) {
        if (text[i] === '\\') {
            i += 2;
            continue;
        }
        if (text[i] === '`') {
            const end = text.indexOf('`', i + 1);
            i = end === -1 ? len : end + 1;
            continue;
        }
        if (text[i] === '$') {
            const end = text.indexOf('$', i + 1);
            i = end === -1 ? len : end + 1;
            continue;
        }
        if (text[i] === '*') {
            if (i + 1 < len && text[i + 1] === '*') {
                if (i + 2 < len && text[i + 2] === '*') {
                    inBold = !inBold;
                    i += 3;
                } else {
                    inBold = !inBold;
                    i += 2;
                }
                continue;
            }
            i++;
            continue;
        }
        i++;
    }

    return inBold;
}

/**
 * Finds the index of the closing '**' delimiter for bold formatting,
 * properly handling nested/trailing italics in runs of asterisks (e.g. '***').
 */
function findClosingBold(text: string, startIndex: number): number {
    let i = startIndex;
    const len = text.length;

    while (i < len) {
        if (text[i] === '\\') {
            i += 2;
            continue;
        }
        if (text[i] === '`') {
            const end = text.indexOf('`', i + 1);
            i = end === -1 ? len : end + 1;
            continue;
        }
        if (text[i] === '$') {
            const end = text.indexOf('$', i + 1);
            i = end === -1 ? len : end + 1;
            continue;
        }
        if (text[i] === '*') {
            let run = 0;
            while (i + run < len && text[i + run] === '*') {
                run++;
            }

            if (run === 2) {
                return i;
            }

            if (run >= 3) {
                // If the inner content has an unclosed italic, the leading asterisk(s)
                // close that italic, and the final two asterisks close bold.
                if (hasUnclosedItalic(text.substring(startIndex, i))) {
                    return i + (run - 2);
                }
                return i;
            }

            i += run;
            continue;
        }
        i++;
    }

    return -1;
}

/**
 * Finds the index of the closing '*' delimiter for italic formatting,
 * ignoring bold ('**') pairs and properly handling runs of asterisks.
 */
function findClosingItalic(text: string, startIndex: number): number {
    let i = startIndex;
    const len = text.length;

    while (i < len) {
        if (text[i] === '\\') {
            i += 2;
            continue;
        }
        if (text[i] === '`') {
            const end = text.indexOf('`', i + 1);
            i = end === -1 ? len : end + 1;
            continue;
        }
        if (text[i] === '$') {
            const end = text.indexOf('$', i + 1);
            i = end === -1 ? len : end + 1;
            continue;
        }
        if (text[i] === '*') {
            let run = 0;
            while (i + run < len && text[i + run] === '*') {
                run++;
            }

            if (run === 1) {
                return i;
            }

            if (run === 2) {
                // Standalone bold delimiter; skip over it
                i += 2;
                continue;
            }

            if (run >= 3) {
                // If inner text has an unclosed bold, the first two asterisks close bold
                // and the final asterisk closes italic.
                if (hasUnclosedBold(text.substring(startIndex, i))) {
                    return i + (run - 1);
                }
                return i;
            }

            i += run;
            continue;
        }
        i++;
    }

    return -1;
}

/**
 * Pass 2: Inline Lexer.
 * Tokenizes a raw text string into a structured array of InlineNode AST elements.
 * Employs recursive scanning for nested formatting (e.g., bold inside links).
 *
 * @param text - The raw markdown text (e.g., inside a paragraph or heading).
 * @param diagnostics - An array to push warnings into (e.g., unclosed delimiters).
 * @param lineOffset - The starting line number for accurate diagnostic logging.
 * @returns An array of parsed InlineNode elements.
 */
export function parseInline(text: string, diagnostics: DiagnosticLog[], lineOffset: number = 0): InlineNode[] {
    const nodes: InlineNode[] = [];
    let i = 0;
    const len = text.length;
    let textBuffer = '';

    // Helper to flush accumulated plain text to the AST
    const flushText = () => {
        if (textBuffer.length > 0) {
            nodes.push({ kind: 'inline-text', value: escapeHtml(textBuffer) });
            textBuffer = '';
        }
    };

    while (i < len) {
        const char = text[i];

        // 1. Forced line break (backslash followed by newline)
        if (char === '\\') {
            if (i + 1 < len && text[i + 1] === '\n') {
                flushText();
                nodes.push({ kind: 'inline-break' });
                i += 2;
                continue;
            } else {
                // Handle escaped characters (e.g., '\*')
                if (i + 1 < len) {
                    textBuffer += text[i + 1];
                    i += 2;
                } else {
                    textBuffer += '\\';
                    i++;
                }
                continue;
            }
        }

        // 2. Inline Code
        if (char === '`') {
            flushText();
            const end = text.indexOf('`', i + 1);
            if (end !== -1) {
                const codeContent = text.substring(i + 1, end);
                nodes.push({ kind: 'inline-code', value: escapeHtml(codeContent) });
                i = end + 1;
            } else {
                diagnostics.push({ level: 'warn', line: lineOffset, message: 'Unclosed inline code block' });
                textBuffer += '`';
                i++;
            }
            continue;
        }

        // 3. Inline Math
        if (char === '$') {
            flushText();
            const end = text.indexOf('$', i + 1);
            if (end !== -1) {
                const mathContent = text.substring(i + 1, end);
                nodes.push({ kind: 'inline-math', value: escapeHtml(mathContent) });
                i = end + 1;
            } else {
                diagnostics.push({ level: 'warn', line: lineOffset, message: 'Unclosed inline math block' });
                textBuffer += '$';
                i++;
            }
            continue;
        }

        // 4. Bold
        if (char === '*' && i + 1 < len && text[i + 1] === '*') {
            flushText();
            const end = findClosingBold(text, i + 2);
            if (end !== -1) {
                const inner = text.substring(i + 2, end);
                nodes.push({ kind: 'inline-strong', children: parseInline(inner, diagnostics, lineOffset) });
                i = end + 2;
            } else {
                diagnostics.push({ level: 'warn', line: lineOffset, message: 'Unclosed bold formatting' });
                textBuffer += '**';
                i += 2;
            }
            continue;
        }

        // 5. Italic
        if (char === '*') {
            flushText();
            const end = findClosingItalic(text, i + 1);
            if (end !== -1) {
                const inner = text.substring(i + 1, end);
                nodes.push({ kind: 'inline-emphasis', children: parseInline(inner, diagnostics, lineOffset) });
                i = end + 1;
            } else {
                textBuffer += '*';
                i++;
            }
            continue;
        }

        // 6. SuperScript
        if (char === '^') {
            flushText();
            const end = text.indexOf('^', i + 1);
            if (end !== -1) {
                const inner = text.substring(i + 1, end);
                nodes.push({ kind: 'inline-super', children: parseInline(inner, diagnostics, lineOffset) });
                i = end + 1;
            } else {
                textBuffer += '^';
                i++;
            }
            continue;
        }

        // 7. SubScript
        if (char === '~') {
            flushText();
            const end = text.indexOf('~', i + 1);
            if (end !== -1) {
                const inner = text.substring(i + 1, end);
                nodes.push({ kind: 'inline-sub', children: parseInline(inner, diagnostics, lineOffset) });
                i = end + 1;
            } else {
                textBuffer += '~';
                i++;
            }
            continue;
        }

        // 8. Links
        if (char === '[') {
            const labelEnd = text.indexOf(']', i + 1);
            if (labelEnd !== -1 && text[labelEnd + 1] === '(') {
                const urlEnd = text.indexOf(')', labelEnd + 2);
                if (urlEnd !== -1) {
                    flushText();
                    const label = text.substring(i + 1, labelEnd);
                    const url = text.substring(labelEnd + 2, urlEnd);
                    nodes.push({
                        kind: 'inline-link',
                        target: url.trim(),
                        children: parseInline(label, diagnostics, lineOffset)
                    });
                    i = urlEnd + 1;
                    continue;
                }
            }
        }

        // Normal text fallback
        textBuffer += char;
        i++;
    }

    flushText();
    return nodes;
}
