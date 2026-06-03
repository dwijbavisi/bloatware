# Markdown Parser Design and Specifications

This document outlines the systematic design, grammar definitions, scanner state machine, and logging specifications for the `md-parser` module.

---

## 1. Subset Grammar Specification

The parser compiles a strict, minimal subset of Markdown into a custom AST (Abstract Syntax Tree).

### Block Grammar
1. **Heading**: A line beginning with 1 to 6 `#` characters followed by a single space.
   * `HeadingNode` = `level` (1..6) + `children` (`InlineNode[]`)
2. **BlockCode**: Starts with a line containing exactly ```` ` (3 backticks) and an optional language string, and ends with a line containing exactly ```` `.
   * `BlockCodeNode` = `lang` (optional string) + `content` (string)
3. **BlockMath**: Starts with a line containing exactly `$$`, and ends with a line containing exactly `$$`.
   * `BlockMathNode` = `content` (string)
4. **Blockquote**: Consecutive lines starting with `> ` (or `>` followed by space). The prefix `> ` is stripped, and the content is recursively parsed as blocks.
   * `BlockquoteNode` = `severity` (defaults to default) + `children` (`BlockNode[]`)
5. **Horizontal Rule**: A line containing exactly `---` or `***`.
   * `HrNode`
6. **List**: A sequence of list items. Unordered items start with `- `, `+ `, or `* `. Ordered items start with one or more digits followed by a dot and a space (e.g. `1. `).
   * `ListNode` = `ordering` + `children` (`ListItemNode[]`)
7. **Paragraph**: A sequence of consecutive non-empty lines that do not trigger other block rules, grouped together.
   * `ParagraphNode` = `children` (`InlineNode[]`)

### Inline Grammar
1. **Bold**: Encased in double asterisks (`**`). Supports nested inline nodes.
2. **Italic**: Encased in single asterisks (`*`). Supports nested inline nodes.
3. **InlineCode**: Encased in single backticks (`` ` ``). Raw text only.
4. **InlineMath**: Encased in single dollar signs (`$`). Raw text only.
5. **Link**: Formatted as `[text](url)`. Content inside brackets supports nested inline nodes. URL is literal.
6. **SuperScript**: Encased in caret signs (`^`). Supports nested inline nodes.
7. **SubScript**: Encased in tildes (`~`). Supports nested inline nodes.
8. **LineBreak**: Denoted by a backslash followed by a newline (`\\\n`).
9. **Text**: Fallback literal characters.

---

## 2. Scanner-Based Parser Design

To ensure proper systematic processing, the parser implements a scanner architecture.

### StringScanner API
The `StringScanner` class wraps a source string and tracks progress:
* `pos: number`: Current character position.
* `src: string`: Input source string.
* `peek(): string`: Returns character at `pos` or `""` if EOF.
* `peekStr(length: number): string`: Returns substring of `length` starting at `pos`.
* `next(): string`: Consumes and returns character at `pos`.
* `match(str: string): boolean`: If next characters match `str`, consumes them and returns true; otherwise returns false.
* `consumeWhile(predicate: (c: string) => boolean): string`: Consumes characters as long as the predicate matches.
* `isEOF(): boolean`: Returns true if the scanner reached the end.

### Inline Parse Flow
The `InlineParser` uses the scanner to perform recursive descent parsing:
1. Loops through string scanner elements.
2. When encountering styling indicators (`**`, `*`, `[`, etc.), it attempts to look ahead and find the matching closing tag.
3. **Graceful Recovery**: If no closing tag is found, the tag character is treated as a simple `TextNode` (e.g. literal `*` or `**`), and the parser resumes from the next character. This avoids hard errors and ensures the build never crashes due to editorial typos.

---

## 3. Logger Integration

The parser uses the application's unified `Logger` namespace `module:md-parser` to record parser transitions for auditing:
* **Logger Instance**: `const log = new Logger('module:md-parser', { level: LogLevel.info });`
* **Log Points**:
  * **Block Scanning**: Logs the start of document processing, detection of block types, and block boundaries.
  * **Inline Parser**: Logs entering inline mode, matched tokens (e.g., `"Found BoldNode starting at pos..."`), and parsing completions.
  * **Syntax Failures/Warnings**: Logs at `LogLevel.warn` if an unclosed tag is detected and details the fallback recovery action.
