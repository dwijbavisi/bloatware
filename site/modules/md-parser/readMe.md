# bloatware Markdown Parser Module

Welcome to the heart of the bloatware rendering engine: the custom Markdown
parser. This module is designed from scratch to be lightweight, strictly typed,
and entirely dependency-free.

Rather than relying on massive external libraries or complex regular expression
engines that suffer from catastrophic backtracking, this parser uses a clean
two-pass architecture to separate structural blocks from inline formatting.


## 1. Two-Pass Parsing Architecture

The entry point is `parseMarkdown()` in `parser/index.ts`. It delegates parsing
into two distinct, decoupled phases.

### Pass 1: The Block Lexer (`pass-one.ts`)
The Block Lexer is responsible for defining the document's structure. It splits
the raw input string by newlines and scans it line-by-line.

Key branches and conditionals include:
- **Fenced Blocks**: If a line strictly starts with three backticks (code) or
  a double-dollar sign (math), it enters a collection mode, gathering all
  subsequent raw lines until the matching closing delimiter is found.
- **Prefix Matching**: Using lightweight regex checks, it scans line prefixes
  for structural elements:
  - Hash signs create Headings (H1 through H4).
  - A greater-than sign creates Blockquotes. It gathers consecutive quoted
    lines, strips the prefix, and recursively feeds them back into the block
    lexer to support nested elements.
  - Hyphens, pluses, or asterisks create Unordered Lists. Numbers create
    Ordered Lists.
  - Three hyphens create a Horizontal Rule.
- **Paragraph Fallback**: Any standard line of text begins a paragraph block.
  The lexer continues to gather lines into the paragraph until it hits an empty
  line or the start of a new structural block.
- **Metadata Extraction**: As a final post-processing step, the lexer checks if
  the last two AST nodes are a Horizontal Rule followed by an Unordered List.
  If so, it extracts them as publication metadata (Author, Published, Conceived).

For every text-containing block (like paragraphs, headings, and list items),
Pass 1 seamlessly hands the raw text string to Pass 2.

### Pass 2: The Inline Lexer (`pass-two.ts`)
The Inline Lexer takes a flat string and tokenizes it into a sequence of safe
AST formatting nodes. It scans character-by-character left-to-right.

Key branches and conditionals include:
- **Raw Delimiters**: If it encounters a backtick (code) or a dollar sign
  (math), it scans forward for the closing delimiter and captures the raw
  content without parsing it further.
- **Recursive Formatting**: When it encounters formatting delimiters like double
  asterisks (bold) or single asterisks (italic), it finds the closing pair,
  extracts the inner text, and recursively calls the Inline Lexer on that inner
  text. This cleanly supports deeply nested constructs (e.g., italic text inside
  bold text).
- **Link Matching**: When it encounters an opening bracket, it scans for a
  closing bracket and a subsequent parenthesis. The URL target is extracted
  directly, while the link label is recursively tokenized.
- **Escaping**: All accumulated plain text is sanitized through the
  `escapeHtml()` utility to prevent cross-site scripting (XSS) vulnerabilities.


## 2. Supported Markdown Constructs

The parser explicitly supports only a defined subset of Markdown designed for
clean, readable technical writing.

### Structural Blocks
- **Headings**: H1 through H4.
- **Paragraphs**: Standard text blocks broken by empty lines.
- **Blockquotes**: Supports nested structural blocks.
- **Lists**: Unordered and Ordered.
- **Code Blocks**: Fenced blocks optionally specifying a language.
- **Math Blocks**: Fenced display equations.
- **Horizontal Rules**: A single line thematic break.

### Inline Formatting (Supports Nesting)
Because Pass 2 is recursive, inline formatting can be combined infinitely.
- **Bold**: Double asterisks surrounding text.
- **Italic**: Single asterisks surrounding text.
- **Superscript**: Caret symbols surrounding text.
- **Subscript**: Tilde symbols surrounding text.
- **Inline Code**: Backticks surrounding text (Not recursive).
- **Inline Math**: Dollar signs surrounding text (Not recursive).
- **Links**: Standard label and URL target (Label supports nested formatting).
- **Forced Line Break**: A backslash followed by a newline.


## 3. Diagnostics & Profiling

The parser is tightly integrated with the project's observability tools.
- **Diagnostics**: Unclosed delimiters (like a missing closing asterisk pair)
  are caught gracefully. The parser falls back to treating them as literal text
  and logs a warning to the `diagnostics` array with the approximate line number.
- **Profiling**: The `profiler.ts` module wraps the execution of
  `parseMarkdown()`, logging the exact millisecond duration required to compile
  the AST tree for performance monitoring.
