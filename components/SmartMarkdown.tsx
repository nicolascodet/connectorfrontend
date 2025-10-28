import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Source {
  index: number;
  document_id: string | null;
  document_name: string;
  source: string;
  document_type: string;
  timestamp: string;
  text_preview: string;
  score?: number;
  file_url?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
}

interface SmartMarkdownProps {
  content: string;
  sources?: Source[];
  onSourceClick?: (source: Source) => void;
}

const SmartMarkdown = ({ content, sources, onSourceClick }: SmartMarkdownProps) => {
  // Map to track which sources have been cited and their numbers
  const citationMap = new Map<number, number>(); // source.index -> citation number
  const citationSources = new Map<number, Source>(); // citation number -> source
  let citationNumber = 1;

  // Helper to get short source name for tooltip
  const getSourceLabel = (source: Source) => {
    const sourceKey = source?.source?.toLowerCase() || '';
    if (sourceKey === 'gmail' || sourceKey === 'outlook') return sourceKey.charAt(0).toUpperCase() + sourceKey.slice(1);

    // Use document name, shortened
    const name = source?.document_name || 'Document';
    if (name.length > 40) return name.substring(0, 37) + '...';
    return name;
  };

  let processedContent = content;

  if (sources && sources.length > 0) {
    // NEW STRATEGY: LLM generates citations in format [Document_Name.pdf]
    // We convert those to numbered citation bubbles [[CIT:1]], [[CIT:2]], etc.

    // First, find all [DocumentName] citations in the text
    // Pattern: [anything inside square brackets that matches a source document name]
    processedContent = processedContent.replace(/\[([^\]]+)\]/g, (match, docNameInBrackets) => {
      // Try to find a source that matches this document name
      const matchingSource = sources.find(source => {
        const sourceName = source.document_name || '';
        // Exact match (case-insensitive)
        if (sourceName.toLowerCase() === docNameInBrackets.toLowerCase()) {
          return true;
        }
        // Partial match - check if the bracketed text is contained in source name
        if (sourceName.toLowerCase().includes(docNameInBrackets.toLowerCase()) ||
            docNameInBrackets.toLowerCase().includes(sourceName.toLowerCase())) {
          return true;
        }
        return false;
      });

      if (matchingSource) {
        // This is a document citation! Convert to numbered citation
        if (!citationMap.has(matchingSource.index)) {
          citationMap.set(matchingSource.index, citationNumber);
          citationSources.set(citationNumber, matchingSource);
          citationNumber++;
        }
        const citNum = citationMap.get(matchingSource.index);
        return `[[CIT:${citNum}]]`; // Remove document name, just show number
      }

      // Not a document citation, keep original (might be markdown link text)
      return match;
    });

    // Also handle markdown links if present (legacy support)
    processedContent = processedContent.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (match, text, url) => {
      // Check if this URL matches a source file_url
      const source = sources.find(s => s.file_url && url.includes(s.file_url));
      if (source) {
        // Assign citation number (reuse if already cited)
        if (!citationMap.has(source.index)) {
          citationMap.set(source.index, citationNumber);
          citationSources.set(citationNumber, source);
          citationNumber++;
        }
        const citNum = citationMap.get(source.index);
        return `${text}[[CIT:${citNum}]]`;
      }
      return match;
    });
  }

  // Render numbered citation bubbles
  const renderContentWithCitations = (text: string) => {
    const parts = text.split(/(\[\[CIT:\d+\]\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[\[CIT:(\d+)\]\]/);
      if (match) {
        const citNum = parseInt(match[1]);
        const source = citationSources.get(citNum);
        return (
          <button
            key={index}
            onClick={() => source && onSourceClick && onSourceClick(source)}
            className="inline-flex items-center justify-center px-2 py-0.5 mx-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition-colors cursor-pointer border border-slate-300"
            title={source ? getSourceLabel(source) : 'View source'}
          >
            {citNum}
          </button>
        );
      }
      return part;
    });
  };
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      return !inline ? (
        <pre className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-5 rounded-xl overflow-x-auto my-4 shadow-lg border border-gray-700">
          <code className="text-sm font-mono leading-relaxed" {...props}>
            {String(children).replace(/\n$/, '')}
          </code>
        </pre>
      ) : (
        <code className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-sm font-mono font-semibold" {...props}>
          {children}
        </code>
      )
    },
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-6 rounded-xl shadow-md">
        <table className="min-w-full border-collapse bg-white rounded-xl overflow-hidden">
          {children}
        </table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className="border-b-2 border-gray-200 px-6 py-3 bg-slate-100 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="border-b border-gray-100 px-6 py-4 text-gray-700">
        {children}
      </td>
    ),
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold text-slate-800 mt-6 mb-4 tracking-tight">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3 tracking-tight flex items-center gap-2">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-bold text-gray-800 mt-5 mb-3 pb-2 border-b-2 border-gradient-to-r from-blue-200 to-purple-200">
        {children}
      </h3>
    ),
    p: ({ children }: any) => {
      // Convert children to string and process citations
      const childText = typeof children === 'string' ? children : children?.toString() || '';
      const hasCitations = childText.includes('[[CIT:');

      return (
        <p className="text-gray-700 leading-relaxed my-3 text-[15px]">
          {hasCitations ? renderContentWithCitations(childText) : children}
        </p>
      );
    },
    strong: ({ children }: any) => (
      <strong className="text-gray-900 font-bold">
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em className="text-slate-600 italic font-medium">
        {children}
      </em>
    ),
    ul: ({ children }: any) => (
      <ul className="my-4 space-y-2 pl-6">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="my-4 space-y-2 pl-6 list-decimal">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-700 leading-relaxed marker:text-slate-500 marker:font-bold">
        {children}
      </li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-slate-500 bg-slate-50/50 pl-6 py-3 rounded-r-lg italic text-gray-700 my-4 shadow-sm">
        {children}
      </blockquote>
    ),
    a: ({ children, href, ...props }: any) => (
      <a
        href={href}
        className="text-slate-600 underline decoration-slate-300 decoration-2 underline-offset-2 font-semibold hover:text-slate-700 hover:decoration-slate-500 transition-all"
        {...props}
      >
        {children}
      </a>
    ),
    hr: () => (
      <hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-6" />
    )
  }

  return (
    <div className="max-w-none">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default SmartMarkdown
