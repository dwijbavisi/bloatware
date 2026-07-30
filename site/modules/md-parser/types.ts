/**
 * Synthesized TypeScript Contracts & Interfaces for v0.1.0 AST
 *
 * This module defines the strict, discriminated union types for the two-pass
 * Markdown parser to guarantee type safety without runtime enum pollution.
 */

// --- Inline AST Nodes --------------------------------------------------------

/**
 * Union type representing all possible inline nodes.
 */
export type InlineNode =
    | TextInlineNode
    | StrongInlineNode
    | EmphasisInlineNode
    | InlineCodeNode
    | InlineMathNode
    | LinkInlineNode
    | SuperScriptInlineNode
    | SubScriptInlineNode
    | ForcedBreakInlineNode;

/**
 * Represents raw literal text.
 *
 * @example
 * const node: TextInlineNode = {
 *     kind: 'inline-text',
 *     value: 'Hello world'
 * };
 */
export interface TextInlineNode {
    kind: 'inline-text';
    value: string;
}

/**
 * Represents bold formatted inline text.
 *
 * @example
 * const node: StrongInlineNode = {
 *     kind: 'inline-strong',
 *     children: [{ kind: 'inline-text', value: 'bold text' }]
 * };
 */
export interface StrongInlineNode {
    kind: 'inline-strong';
    children: InlineNode[];
}

/**
 * Represents italic formatted inline text.
 *
 * @example
 * const node: EmphasisInlineNode = {
 *     kind: 'inline-emphasis',
 *     children: [{ kind: 'inline-text', value: 'italic text' }]
 * };
 */
export interface EmphasisInlineNode {
    kind: 'inline-emphasis';
    children: InlineNode[];
}

/**
 * Represents inline monospace code text.
 *
 * @example
 * const node: InlineCodeNode = {
 *     kind: 'inline-code',
 *     value: 'console.log("hi")'
 * };
 */
export interface InlineCodeNode {
    kind: 'inline-code';
    value: string;
}

/**
 * Represents inline mathematical notation.
 *
 * @example
 * const node: InlineMathNode = {
 *     kind: 'inline-math',
 *     value: 'E=mc^2'
 * };
 */
export interface InlineMathNode {
    kind: 'inline-math';
    value: string;
}

/**
 * Represents an inline hyperlink.
 *
 * @example
 * const node: LinkInlineNode = {
 *     kind: 'inline-link',
 *     target: '/articles/2026/03/hello/',
 *     children: [{ kind: 'inline-text', value: 'Click here' }]
 * };
 */
export interface LinkInlineNode {
    kind: 'inline-link';
    target: string;
    children: InlineNode[];
}

/**
 * Represents superscript text structure.
 *
 * @example
 * const node: SuperScriptInlineNode = {
 *     kind: 'inline-super',
 *     children: [{ kind: 'inline-text', value: 'th' }]
 * };
 */
export interface SuperScriptInlineNode {
    kind: 'inline-super';
    children: InlineNode[];
}

/**
 * Represents subscript text structure.
 *
 * @example
 * const node: SubScriptInlineNode = {
 *     kind: 'inline-sub',
 *     children: [{ kind: 'inline-text', value: '2' }]
 * };
 */
export interface SubScriptInlineNode {
    kind: 'inline-sub';
    children: InlineNode[];
}

/**
 * Represents a forced line break within inline text.
 *
 * @example
 * const node: ForcedBreakInlineNode = {
 *     kind: 'inline-break'
 * };
 */
export interface ForcedBreakInlineNode {
    kind: 'inline-break';
}

// --- Block AST Nodes ---------------------------------------------------------

/**
 * Union type representing all possible block-level nodes.
 */
export type BlockNode =
    | HeadingBlockNode
    | ParagraphBlockNode
    | CodeBlockNode
    | MathBlockNode
    | BlockquoteBlockNode
    | ListBlockNode
    | HorizontalRuleBlockNode;

/**
 * Represents a structural heading node.
 *
 * @example
 * const node: HeadingBlockNode = {
 *     kind: 'block-heading',
 *     level: 2,
 *     children: [{ kind: 'inline-text', value: 'Title' }]
 * };
 */
export interface HeadingBlockNode {
    kind: 'block-heading';
    level: 1 | 2 | 3 | 4;
    children: InlineNode[];
}

/**
 * Represents a paragraph of text.
 *
 * @example
 * const node: ParagraphBlockNode = {
 *     kind: 'block-paragraph',
 *     children: [{ kind: 'inline-text', value: 'A paragraph.' }]
 * };
 */
export interface ParagraphBlockNode {
    kind: 'block-paragraph';
    children: InlineNode[];
}

/**
 * Represents a multi-line syntax-highlighted code block.
 *
 * @example
 * const node: CodeBlockNode = {
 *     kind: 'block-code',
 *     language: 'typescript',
 *     value: 'const x = 1;'
 * };
 */
export interface CodeBlockNode {
    kind: 'block-code';
    language?: string;
    value: string;
}

/**
 * Represents a multi-line mathematical block equation.
 *
 * @example
 * const node: MathBlockNode = {
 *     kind: 'block-math',
 *     value: 'a^2 + b^2 = c^2'
 * };
 */
export interface MathBlockNode {
    kind: 'block-math';
    value: string;
}

/**
 * Represents a blockquote section, capable of nesting other block nodes.
 *
 * @example
 * const node: BlockquoteBlockNode = {
 *     kind: 'block-quote',
 *     children: [
 *         {
 *             kind: 'block-paragraph',
 *             children: [{ kind: 'inline-text', value: 'Quoted text' }]
 *         }
 *     ]
 * };
 */
export interface BlockquoteBlockNode {
    kind: 'block-quote';
    children: BlockNode[];
}

/**
 * Represents a single list item within a list.
 *
 * @example
 * const node: ListItemNode = {
 *     kind: 'list-item',
 *     children: [{ kind: 'inline-text', value: 'Item one' }]
 * };
 */
export interface ListItemNode {
    kind: 'list-item';
    children: InlineNode[];
}

/**
 * Represents an ordered or unordered list container.
 *
 * @example
 * const node: ListBlockNode = {
 *     kind: 'block-list',
 *     ordered: false,
 *     items: [
 *         { kind: 'list-item', children: [{ kind: 'inline-text', value: 'A' }] }
 *     ]
 * };
 */
export interface ListBlockNode {
    kind: 'block-list';
    ordered: boolean;
    items: ListItemNode[];
}

/**
 * Represents a thematic horizontal rule divider.
 *
 * @example
 * const node: HorizontalRuleBlockNode = {
 *     kind: 'block-hr'
 * };
 */
export interface HorizontalRuleBlockNode {
    kind: 'block-hr';
}

// --- Document & Metadata Contracts -------------------------------------------

/**
 * Extracted frontmatter/publication metadata of the parsed document.
 *
 * @example
 * const meta: DocumentMetadata = {
 *     author: 'Dwij Bavisi',
 *     published: 'March 26, 2026',
 *     conceived: 'March 26, 2026',
 *     sortDate: '2026-03-26'
 * };
 */
export interface DocumentMetadata {
    author?: string;
    published?: string;
    conceived?: string;
    sortDate?: string; // Formatted YYYY-MM-DD for chronological sorting
}

/**
 * Diagnostic log generated during Markdown parsing.
 *
 * @example
 * const log: DiagnosticLog = {
 *     level: 'warn',
 *     line: 42,
 *     message: 'Unclosed bold formatting token'
 * };
 */
export interface DiagnosticLog {
    level: 'warn' | 'error';
    line?: number;
    message: string;
}

/**
 * Final structure returned by the Markdown parser.
 *
 * @example
 * const result: ParseResult = {
 *     ast: [
 *         {
 *             kind: 'block-paragraph',
 *             children: [{ kind: 'inline-text', value: 'Content' }]
 *         }
 *     ],
 *     metadata: { author: 'Dwij Bavisi' },
 *     diagnostics: []
 * };
 */
export interface ParseResult {
    ast: BlockNode[];
    metadata: DocumentMetadata;
    diagnostics: DiagnosticLog[];
}
