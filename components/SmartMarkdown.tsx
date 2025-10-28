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
  // Convert markdown document links to numbered citations like ChatGPT
  const citationMap = new Map<string, number>();
  const citationSources = new Map<number, Source>();
  let citationIndex = 1;

  let processedContent = content;

  if (sources && sources.length > 0) {
    // Find all markdown links and convert to citations with special marker
    processedContent = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (match, text, url) => {
      // Check if this URL matches a source file_url
      const source = sources.find(s => s.file_url && url.includes(s.file_url));
      if (source) {
        // Assign citation number
        if (!citationMap.has(url)) {
          citationMap.set(url, citationIndex);
          citationSources.set(citationIndex, source);
          citationIndex++;
        }
        const citNum = citationMap.get(url);
        // Return text with citation using special syntax that we'll replace later
        return `${text} [[CIT:${citNum}]]`;
      }
      // Keep regular markdown links as-is
      return match;
    });
  }

  // After markdown rendering, we'll replace [[CIT:X]] with clickable citations
  const renderContentWithCitations = (text: string) => {
    const parts = text.split(/(\[\[CIT:\d+\]\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[\[CIT:(\d+)\]\]/);
      if (match) {
        const citNum = parseInt(match[1]);
        const source = citationSources.get(citNum);
        return (
          <sup key={index} className="inline-block">
            <button
              onClick={() => source && onSourceClick && onSourceClick(source)}
              className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
              title={source?.document_name || 'View source'}
            >
              [{citNum}]
            </button>
          </sup>
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
        <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm font-mono font-semibold" {...props}>
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
      <th className="border-b-2 border-gray-200 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 text-left font-bold text-gray-800 text-sm uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="border-b border-gray-100 px-6 py-4 text-gray-700">
        {children}
      </td>
    ),
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-6 mb-4 tracking-tight">
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
      <em className="text-blue-600 italic font-medium">
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
      <li className="text-gray-700 leading-relaxed marker:text-blue-500 marker:font-bold">
        {children}
      </li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 pl-6 py-3 rounded-r-lg italic text-gray-700 my-4 shadow-sm">
        {children}
      </blockquote>
    ),
    a: ({ children, href, ...props }: any) => (
      <a
        href={href}
        className="text-blue-600 underline decoration-blue-300 decoration-2 underline-offset-2 font-semibold hover:text-blue-700 hover:decoration-blue-500 transition-all"
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
