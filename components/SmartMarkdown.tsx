import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface SmartMarkdownProps {
  content: string
  onLinkClick?: (url: string, fileName: string) => void
}

const SmartMarkdown = ({ content, onLinkClick }: SmartMarkdownProps) => {
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
    p: ({ children }: any) => (
      <p className="text-gray-700 leading-relaxed my-3 text-[15px]">
        {children}
      </p>
    ),
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
    a: ({ children, href, ...props }: any) => {
      const handleClick = (e: React.MouseEvent) => {
        // If onLinkClick is provided and this looks like a file URL, intercept it
        if (onLinkClick && href && (
          href.includes('blob.core.windows.net') ||
          href.includes('file_url') ||
          href.includes('download') ||
          href.match(/\.(pdf|png|jpg|jpeg|gif|doc|docx|xls|xlsx|ppt|pptx)$/i)
        )) {
          e.preventDefault();
          // Extract filename from children or URL
          const fileName = typeof children === 'string' ? children : 'Document';
          onLinkClick(href, fileName);
        }
      };

      return (
        <a
          href={href}
          onClick={handleClick}
          className="text-blue-600 underline decoration-blue-300 decoration-2 underline-offset-2 font-semibold hover:text-blue-700 hover:decoration-blue-500 transition-all cursor-pointer"
          {...props}
        >
          {children}
        </a>
      );
    },
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
