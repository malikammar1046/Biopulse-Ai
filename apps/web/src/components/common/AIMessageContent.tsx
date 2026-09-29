import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface AIMessageContentProps {
  content: string;
  className?: string;
  isFemale?: boolean;
}

/**
 * Reusable Markdown renderer for BioPulse AI Companion / Assistant messages.
 *
 * Enforces strict security (no dangerouslySetInnerHTML, no rehype-raw, skipHtml=true),
 * safe external link handling (target="_blank", rel="noopener noreferrer"),
 * and professional, restrained typography hierarchy suitable for chat bubbles.
 */
export const AIMessageContent: React.FC<AIMessageContentProps> = ({
  content,
  className = '',
  isFemale = false,
}) => {
  const accentTextColor = isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]';
  const accentLinkColor = isFemale
    ? 'text-[#F43F7D] hover:text-[#DC326C]'
    : 'text-[#0288D1] hover:text-[#026AA7]';

  return (
    <div className={`ai-markdown-content text-inherit leading-relaxed ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml={true}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold font-display text-inherit mt-3 mb-1.5 first:mt-0 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold font-display text-inherit mt-2.5 mb-1.5 first:mt-0 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-inherit mt-2 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-inherit mt-1.5 mb-1 first:mt-0">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-xs font-semibold text-inherit mt-1 mb-0.5 first:mt-0 uppercase tracking-wide">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-semibold text-inherit mt-1 mb-0.5 first:mt-0 uppercase tracking-wide opacity-80">
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p className="text-xs sm:text-sm leading-relaxed text-inherit mb-2 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-inherit">
              {children}
            </strong>
          ),
          b: ({ children }) => (
            <b className="font-semibold text-inherit">
              {children}
            </b>
          ),
          em: ({ children }) => (
            <em className="italic text-inherit">
              {children}
            </em>
          ),
          i: ({ children }) => (
            <i className="italic text-inherit">
              {children}
            </i>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 sm:pl-5 space-y-1 my-2 text-xs sm:text-sm text-inherit">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 sm:pl-5 space-y-1 my-2 text-xs sm:text-sm text-inherit">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-0.5 text-inherit">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-current/30 bg-black/5 dark:bg-white/5 pl-3 pr-2 py-1.5 my-2 rounded-r-lg text-xs sm:text-sm italic text-inherit">
              {children}
            </blockquote>
          ),
          pre: ({ children }) => (
            <pre className="my-2.5 p-3 rounded-xl bg-[#0F172A] text-[#F8FAFC] font-mono text-xs overflow-x-auto border border-[#334155] shadow-xs [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit [&>code]:border-0">
              {children}
            </pre>
          ),
          code: ({ children, ...props }) => (
            <code
              className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] sm:text-xs bg-[#F1F5F9] ${accentTextColor} border border-[#E2E8F0] break-words`}
              {...props}
            >
              {children}
            </code>
          ),
          hr: () => (
            <hr className="my-3 border-t border-current/15" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline font-medium break-words transition-colors ${accentLinkColor}`}
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2.5 rounded-lg border border-[#E2E8F0]">
              <table className="w-full text-xs sm:text-sm border-collapse text-left text-inherit">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#334155]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold text-left">
              {children}
            </th>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#E2E8F0]">
              {children}
            </tbody>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-inherit">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
