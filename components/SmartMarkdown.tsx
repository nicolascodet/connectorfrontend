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
  // Convert markdown links to inline source bubbles
  const citationMap = new Map<string, Source>();

  // Helper to get short source name
  const getSourceLabel = (source: Source) => {
    const sourceKey = source?.source?.toLowerCase() || '';
    if (sourceKey === 'gmail' || sourceKey === 'outlook') return sourceKey.charAt(0).toUpperCase() + sourceKey.slice(1);

    // Use document name, shortened
    const name = source?.document_name || 'Document';
    if (name.length > 25) return name.substring(0, 22) + '...';
    return name;
  };

  let processedContent = content;

  if (sources && sources.length > 0) {
    // Track which sources we've already added bubbles for to avoid duplicates
    const usedSources = new Set<number>();

    // Find all markdown links [text](url) and replace with source bubbles
    processedContent = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (match, text, url) => {
      // Check if this URL matches a source file_url
      const source = sources.find(s => s.file_url && url.includes(s.file_url));
      if (source) {
        const sourceId = `source_${source.index}_${Date.now()}`;
        citationMap.set(sourceId, source);
        usedSources.add(source.index);
        // Remove the markdown link text and just add a marker for the bubble
        return `[[BUBBLE:${sourceId}:${getSourceLabel(source)}]]`;
      }
      // Keep regular markdown links as-is
      return match;
    });

    // Detect "View Document" patterns
    processedContent = processedContent.replace(/View Document\.?/gi, (match) => {
      // Find first unused source
      const source = sources.find(s => !usedSources.has(s.index));
      if (source) {
        const sourceId = `source_${source.index}_view_${Date.now()}`;
        citationMap.set(sourceId, source);
        usedSources.add(source.index);
        return `[[BUBBLE:${sourceId}:${getSourceLabel(source)}]]`;
      }
      return match;
    });

    // Detect document name mentions in text (e.g., "Workers Compensation Summary Report")
    sources.forEach((source) => {
      if (usedSources.has(source.index)) return; // Skip if already used

      const docName = source.document_name;
      if (!docName || docName.length < 5) return; // Skip very short names

      // Create a regex to find this document name in the text
      // Escape special regex characters and make it case-insensitive
      const escapedName = docName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedName}\\b`, 'gi');

      // Only replace the FIRST occurrence to avoid cluttering
      let replaced = false;
      processedContent = processedContent.replace(regex, (match) => {
        if (replaced) return match; // Only replace first occurrence
        replaced = true;

        const sourceId = `source_${source.index}_name_${Date.now()}`;
        citationMap.set(sourceId, source);
        usedSources.add(source.index);
        return `${match} [[BUBBLE:${sourceId}:${getSourceLabel(source)}]]`;
      });
    });
  }

  // Render source bubbles
  const renderContentWithCitations = (text: string) => {
    const parts = text.split(/(\[\[BUBBLE:[^\]]+\]\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[\[BUBBLE:([^:]+):([^\]]+)\]\]/);
      if (match) {
        const [, sourceId, label] = match;
        const source = citationMap.get(sourceId);
        return (
          <button
            key={index}
            onClick={() => source && onSourceClick && onSourceClick(source)}
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-full transition-colors cursor-pointer border border-slate-300"
            title={source?.document_name || 'View source'}
          >
            <span>{label}</span>
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
