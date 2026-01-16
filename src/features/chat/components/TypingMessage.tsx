import { useTypingEffect } from '../hooks/useTypingEffect';
import { Button } from '@/components/ui/button';
import type { ChatBotMessage } from '@/interfaces/chatbot.types';

interface TypingMessageProps {
    message: ChatBotMessage;
    /** Whether this message should have typing effect */
    shouldAnimate: boolean;
    /** Callback when typing animation completes */
    onTypingComplete?: () => void;
    /** Speed of typing (ms per character) */
    typingSpeed?: number;
    /** Variant for different size contexts */
    variant?: 'default' | 'mini';
}

export default function TypingMessage({
    message,
    shouldAnimate,
    onTypingComplete,
    typingSpeed = 15,
    variant = 'default'
}: TypingMessageProps) {
    const { displayedText, isTyping, skipToEnd } = useTypingEffect(
        message.text,
        shouldAnimate,
        { typingSpeed, onComplete: onTypingComplete }
    );

    // If not animating, show full text
    const textToShow = shouldAnimate ? displayedText : message.text;

    const isMini = variant === 'mini';

    return (
        <div className={`flex flex-col gap-2 items-start ${isMini ? 'max-w-[85%]' : 'max-w-[80%]'}`}>
            <div
                className={`shadow-sm bg-white text-slate-800 border border-slate-100 relative group ${isMini
                        ? 'rounded-2xl rounded-bl-sm px-3 py-2 text-sm'
                        : 'rounded-2xl px-4 py-3'
                    }`}
                onClick={isTyping ? skipToEnd : undefined}
                style={{ cursor: isTyping ? 'pointer' : 'default' }}
                title={isTyping ? 'Click để bỏ qua' : undefined}
            >
                <p className={`leading-relaxed whitespace-pre-wrap ${isMini ? '' : 'text-sm'}`}>
                    {textToShow}
                    {isTyping && (
                        <span className="inline-block w-0.5 h-4 bg-purple-500 ml-0.5 animate-pulse align-middle" />
                    )}
                </p>
            </div>

            {/* Show buttons only after typing is complete */}
            {!isTyping && message.buttons && message.buttons.length > 0 && (
                <div className={`flex flex-col w-full ${isMini ? 'gap-1.5 mt-2' : 'gap-2'}`}>
                    {message.buttons.map((button, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            size={isMini ? 'sm' : 'default'}
                            className={`w-full justify-start text-left hover:bg-purple-50 border-purple-200 text-purple-600 hover:text-purple-700 ${isMini ? 'rounded-lg text-xs' : 'rounded-xl'
                                }`}
                            onClick={() => {
                                if (button.type === 'web_url' && button.payload) {
                                    window.open(button.payload, '_blank');
                                }
                            }}
                        >
                            {button.title}
                        </Button>
                    ))}
                </div>
            )}

            {!isMini && (
                <span className="text-xs text-slate-400 px-1">
                    {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
            )}
        </div>
    );
}
