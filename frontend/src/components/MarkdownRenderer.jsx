import { useState } from "react";

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-language">{language || "code"}</span>
        <button
          type="button"
          className="code-copy-btn"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-block-content">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function parseInlineText(text) {
  if (!text) return null;

  // Split by inline code: `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((codePart, i) => {
    if (codePart.startsWith("`") && codePart.endsWith("`") && codePart.length > 2) {
      return (
        <code key={i} className="inline-code">
          {codePart.slice(1, -1)}
        </code>
      );
    }

    // Split by bold: **bold**
    const boldParts = codePart.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((boldPart, j) => {
      if (boldPart.startsWith("**") && boldPart.endsWith("**") && boldPart.length > 4) {
        return <strong key={`${i}-${j}`}>{boldPart.slice(2, -2)}</strong>;
      }

      // Split by italic: *italic*
      const italicParts = boldPart.split(/(\*[^*]+\*)/g);
      return italicParts.map((italicPart, k) => {
        if (italicPart.startsWith("*") && italicPart.endsWith("*") && italicPart.length > 2) {
          return <em key={`${i}-${j}-${k}`}>{italicPart.slice(1, -1)}</em>;
        }
        return italicPart;
      });
    });
  });
}

function parseMarkdownBlock(block, blockIndex) {
  const lines = block.split("\n");

  // Check if it's a heading
  const firstLine = lines[0].trim();
  if (firstLine.startsWith("### ")) {
    return <h3 key={blockIndex}>{parseInlineText(firstLine.slice(4))}</h3>;
  }
  if (firstLine.startsWith("## ")) {
    return <h2 key={blockIndex}>{parseInlineText(firstLine.slice(3))}</h2>;
  }
  if (firstLine.startsWith("# ")) {
    return <h1 key={blockIndex}>{parseInlineText(firstLine.slice(2))}</h1>;
  }

  // Check if it's a blockquote
  if (lines.every((line) => line.trim().startsWith(">") || line.trim() === "")) {
    const quoteText = lines
      .map((line) => line.replace(/^>\s?/, ""))
      .join("\n");
    return (
      <blockquote key={blockIndex}>
        {parseInlineText(quoteText)}
      </blockquote>
    );
  }

  // Check if it's an unordered list
  const isUnorderedList = lines.some((line) => /^\s*[-*•]\s+/.test(line));
  if (isUnorderedList) {
    return (
      <ul key={blockIndex} className="markdown-list">
        {lines.map((line, liIndex) => {
          const match = line.match(/^\s*[-*•]\s+(.*)$/);
          if (match) {
            return <li key={liIndex}>{parseInlineText(match[1])}</li>;
          }
          if (line.trim()) {
            return <div key={liIndex} className="list-subtext">{parseInlineText(line)}</div>;
          }
          return null;
        })}
      </ul>
    );
  }

  // Check if it's an ordered list
  const isOrderedList = lines.some((line) => /^\s*\d+\.\s+/.test(line));
  if (isOrderedList) {
    return (
      <ol key={blockIndex} className="markdown-list ordered">
        {lines.map((line, liIndex) => {
          const match = line.match(/^\s*\d+\.\s+(.*)$/);
          if (match) {
            return <li key={liIndex}>{parseInlineText(match[1])}</li>;
          }
          if (line.trim()) {
            return <div key={liIndex} className="list-subtext">{parseInlineText(line)}</div>;
          }
          return null;
        })}
      </ol>
    );
  }

  // Regular paragraph
  return (
    <p key={blockIndex} className="markdown-paragraph">
      {lines.map((line, lineIdx) => (
        <span key={lineIdx}>
          {parseInlineText(line)}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      ))}
    </p>
  );
}

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Split content by code blocks: ```lang ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-body">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const contentWithoutFences = part.slice(3, -3);
          const firstNewlineIndex = contentWithoutFences.indexOf("\n");
          let language = "";
          let code = contentWithoutFences;

          if (firstNewlineIndex !== -1) {
            language = contentWithoutFences.slice(0, firstNewlineIndex).trim();
            code = contentWithoutFences.slice(firstNewlineIndex + 1);
          }

          // Clean trailing newline if any
          code = code.replace(/\n$/, "");

          return (
            <CodeBlock
              key={index}
              language={language}
              code={code}
            />
          );
        }

        // Regular markdown text: split into paragraphs by double newline
        const blocks = part.split(/\n\n+/).filter((block) => block.trim().length > 0);
        return blocks.map((block, blockIndex) =>
          parseMarkdownBlock(block, `${index}-${blockIndex}`)
        );
      })}
    </div>
  );
}
