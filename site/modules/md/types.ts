const enum MDNodeType {
    // Inline Node Types
    text = 'md-text',
    bold = 'md-bold',
    italic = 'md-italic',
    link = 'md-link',
    inlineCode = 'md-inline-code',
    inlineMath = 'md-inline-math',
    superScript = 'md-sup',
    subScript = 'md-sub',
    lineBreak = 'md-br',

    // Block Node Types
    heading = 'md-heading',
    paragraph = 'md-paragraph',
    blockquote = 'md-blockquote',
    list = 'md-list',
    listItem = 'md-list-item',
    blockCode = 'md-block-code',
    blockMath = 'md-block-math',
    horizontalRule = 'md-hr',
}

const enum MDBlockquoteType {
    // Highlight
    default = 'md-blockquote-default',

    // Severity based
    info = 'md-blockquote-info',
    success = 'md-blockquote-success',
    warn = 'md-blockquote-warn',
    error = 'md-blockquote-error',
}

const enum MDListOrderingType {
    // Unordered lists
    hyphen = 'md-list-unordered-hyphen',
    plus = 'md-list-unordered-plus',
    asterisk = 'md-list-unordered-asterisk',

    // Ordered lists
    oneTwoThree = 'md-list-ordered-123',
    abc = 'md-list-ordered-abc',
    ABC = 'md-list-ordered-ABC',
    ivx = 'md-list-ordered-ivx',
    IVX = 'md-list-ordered-IVX',
}

interface _MDNode {
    type: string;
}

// -----------------------------------------------------------------------------
// Inline Nodes

interface TextNode extends _MDNode {
    type: MDNodeType.text;
    content: string;
}

interface BoldNode extends _MDNode {
    type: MDNodeType.bold;
    contents: InlineNode[];
}

interface ItalicNode extends _MDNode {
    type: MDNodeType.italic;
    contents: InlineNode[];
}

interface LinkNode extends _MDNode {
    type: MDNodeType.link;
    href: string;
    contents: InlineNode[];
}

interface InlineCodeNode extends _MDNode {
    type: MDNodeType.inlineCode;
    content: string;
}

interface InlineMathNode extends _MDNode {
    type: MDNodeType.inlineMath;
    content: string;
}

interface SuperScriptNode extends _MDNode {
    type: MDNodeType.superScript;
    contents: InlineNode[];
}

interface SubScriptNode extends _MDNode {
    type: MDNodeType.subScript;
    contents: InlineNode[];
}

interface BrNode extends _MDNode {
    type: MDNodeType.lineBreak;
}

type InlineNode =
    | TextNode
    | BoldNode
    | ItalicNode
    | LinkNode
    | InlineCodeNode
    | InlineMathNode
    | SuperScriptNode
    | SubScriptNode
    | BrNode;

// -----------------------------------------------------------------------------
// Block Nodes

interface HeadingNode extends _MDNode {
    type: MDNodeType.heading;
    level: 1 | 2 | 3 | 4 | 5 | 6;
    children: InlineNode[];
}

interface ParagraphNode extends _MDNode {
    type: MDNodeType.paragraph;
    children: InlineNode[];
}

interface BlockquoteNode extends _MDNode {
    type: MDNodeType.blockquote;
    severity: MDBlockquoteType;
    children: BlockNode[];
}

interface ListNode extends _MDNode {
    type: MDNodeType.list;
    ordering: MDListOrderingType;
    children: ListItemNode[];
}

interface ListItemNode extends _MDNode {
    type: MDNodeType.listItem;
    contents: InlineNode[];
}

interface BlockCodeNode extends _MDNode {
    type: MDNodeType.blockCode;
    lang?: string;
    content: string;
}

interface BlockMathNode extends _MDNode {
    type: MDNodeType.blockMath;
    content: string;
}

interface HrNode extends _MDNode {
    type: MDNodeType.horizontalRule;
}

type BlockNode =
    | HeadingNode
    | ParagraphNode
    | BlockquoteNode
    | ListNode
    | ListItemNode
    | BlockCodeNode
    | BlockMathNode
    | HrNode;

// -----------------------------------------------------------------------------
// Metadata

interface MDMetadata {
    publication?: {
        author: string;
        published: string;
        conceived: string;
    }
}

interface MDParseResult {
    children: BlockNode[];
    metadata: MDMetadata;
}

// -----------------------------------------------------------------------------
// exports

export type {
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
}

export {
    MDNodeType,
    MDBlockquoteType,
    MDListOrderingType,
}
