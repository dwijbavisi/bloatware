// ─── Inline Nodes ────────────────────────────────────────────────────────────

export interface TextNode {
    type: "text";
    value: string;
}

export interface BoldNode {
    type: "bold";
    children: InlineNode[];
}

export interface ItalicNode {
    type: "italic";
    children: InlineNode[];
}

export interface LinkNode {
    type: "link";
    href: string;
    children: InlineNode[];
}

export interface InlineCodeNode {
    type: "inline-code";
    value: string;
}

export interface MathInlineNode {
    type: "math-inline";
    source: string;
}

export interface SupNode {
    type: "sup";
    children: InlineNode[];
}

export interface SubNode {
    type: "sub";
    children: InlineNode[];
}

export interface BrNode {
    type: "br";
}

export type InlineNode =
    | TextNode
    | BoldNode
    | ItalicNode
    | LinkNode
    | InlineCodeNode
    | MathInlineNode
    | SupNode
    | SubNode
    | BrNode;

// ─── Block Nodes ─────────────────────────────────────────────────────────────

export interface HeadingNode {
    type: "heading";
    level: 1 | 2 | 3 | 4 | 5 | 6;
    children: InlineNode[];
}

export interface ParagraphNode {
    type: "paragraph";
    children: InlineNode[];
}

export interface BlockquoteNode {
    type: "blockquote";
    children: BlockNode[];
}

export interface ListItem {
    children: InlineNode[];
}

export interface ListNode {
    type: "list";
    ordered: boolean;
    items: ListItem[];
}

export interface HrNode {
    type: "hr";
}

export interface MathBlockNode {
    type: "math-block";
    source: string;
}

export interface CodeBlockNode {
    type: "code-block";
    lang: string | undefined;
    code: string;
}

export type BlockNode =
    | HeadingNode
    | ParagraphNode
    | BlockquoteNode
    | ListNode
    | HrNode
    | MathBlockNode
    | CodeBlockNode;

// ─── Metadata & Result ───────────────────────────────────────────────────────

export interface ParsedMetadata {
    author?: string;
    published?: string;
    conceived?: string;
    raw: Record<string, string>;
}

export interface ParseResult {
    nodes: BlockNode[];
    metadata: ParsedMetadata;
}
