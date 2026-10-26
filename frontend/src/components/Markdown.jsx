import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

function textOf(node) {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textOf).join("");
  return node?.props?.children ? textOf(node.props.children) : "";
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const code = children?.props;
  const lang = /language-(\w+)/.exec(code?.className || "")?.[1] || "code";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(textOf(code?.children).replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <div className="codeblock">
      <div className="codeblock-bar">
        <span>{lang}</span>
        <button onClick={copy} aria-label="Copy code">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}

// Models often emit \( \) and \[ \] math delimiters; remark-math wants $ and $$.
// Fenced code is left untouched.
function normalizeMath(src) {
  return src
    .split(/(```[\s\S]*?(?:```|$))/g)
    .map((part, i) =>
      i % 2
        ? part
        : part
            .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => "\n$$\n" + m.trim() + "\n$$\n")
            .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => "$" + m.trim() + "$"),
    )
    .join("");
}

const components = {
  pre: CodeBlock,
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
};

function Markdown({ children }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: false, ignoreMissing: true }]]}
        components={components}
      >
        {normalizeMath(children)}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
