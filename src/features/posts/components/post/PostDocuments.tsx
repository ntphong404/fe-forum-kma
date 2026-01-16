import { FileText, ExternalLink } from 'lucide-react';

interface PostDocumentsProps {
    documents: string[];
}

/**
 * Extract filename from URL
 */
function getFileName(fileUrl: string, fallbackIndex: number): string {
    try {
        const urlObj = new URL(fileUrl);
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop();
        return filename ? decodeURIComponent(filename) : `Tài liệu đính kèm ${fallbackIndex + 1}`;
    } catch {
        return `Tài liệu đính kèm ${fallbackIndex + 1}`;
    }
}

export default function PostDocuments({ documents }: PostDocumentsProps) {
    if (!documents || documents.length === 0) return null;

    return (
        <div className="mb-3 space-y-2">
            {documents.map((url, index) => {
                const fileName = getFileName(url, index);
                const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE';

                return (
                    <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
                    >
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                                {fileName}
                            </p>
                            <p className="text-xs text-slate-400">{fileExt}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </a>
                );
            })}
        </div>
    );
}
