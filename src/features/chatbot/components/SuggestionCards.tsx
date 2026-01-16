import { useState, useEffect, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { getRandomSuggestions, type Suggestion } from '../data/suggestions';

interface SuggestionCardsProps {
    onSelectSuggestion: (text: string) => void;
    count?: number;
    autoRotateInterval?: number; // in milliseconds
}

export default function SuggestionCards({
    onSelectSuggestion,
    count = 4,
    autoRotateInterval = 6000
}: SuggestionCardsProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);

    // Refresh suggestions with animation
    const refreshSuggestions = useCallback(() => {
        setIsAnimating(true);
        // Wait for fade out animation
        setTimeout(() => {
            setSuggestions(getRandomSuggestions(count));
            setIsAnimating(false);
        }, 300);
    }, [count]);

    // Load random suggestions on mount
    useEffect(() => {
        setSuggestions(getRandomSuggestions(count));
    }, [count]);

    // Auto rotate suggestions every interval
    useEffect(() => {
        const intervalId = setInterval(() => {
            refreshSuggestions();
        }, autoRotateInterval);

        return () => clearInterval(intervalId);
    }, [autoRotateInterval, refreshSuggestions]);

    return (
        <div className="flex flex-col items-center gap-6 py-8 px-4">
            {/* Header Icon */}
            <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white" />
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-800">Bắt đầu cuộc trò chuyện</h2>
                <p className="text-sm text-slate-500 max-w-sm">
                    Chọn gợi ý bên dưới hoặc nhập câu hỏi của bạn để bắt đầu trò chuyện với AI
                </p>
            </div>

            {/* Suggestion Cards - Single Row */}
            <div
                className={`flex flex-row gap-3 w-full max-w-3xl overflow-x-auto pb-2 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                    }`}
            >
                {suggestions.map((suggestion) => {
                    const IconComponent = suggestion.icon;
                    return (
                        <button
                            key={suggestion.id}
                            onClick={() => onSelectSuggestion(suggestion.text)}
                            className="group flex flex-col items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md transition-all duration-200 text-left flex-1 min-w-[140px] max-w-[180px]"
                        >
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 flex items-center justify-center transition-colors flex-shrink-0">
                                <IconComponent className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
                            </div>

                            {/* Text */}
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 line-clamp-2">
                                    {suggestion.shortText}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Nhấn để bắt đầu</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
