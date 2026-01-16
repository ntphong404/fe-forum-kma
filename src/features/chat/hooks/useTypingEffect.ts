import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTypingEffectOptions {
    /** Speed of typing in milliseconds per character */
    typingSpeed?: number;
    /** Callback when typing is complete */
    onComplete?: () => void;
}

interface UseTypingEffectReturn {
    /** Currently displayed text */
    displayedText: string;
    /** Whether typing animation is in progress */
    isTyping: boolean;
    /** Whether typing has completed */
    isComplete: boolean;
    /** Skip to end immediately */
    skipToEnd: () => void;
}

/**
 * Hook to create a typewriter effect for text
 * @param text - The full text to type out
 * @param shouldStart - Whether to start the typing effect
 * @param options - Configuration options
 */
export function useTypingEffect(
    text: string,
    shouldStart: boolean = true,
    options: UseTypingEffectOptions = {}
): UseTypingEffectReturn {
    const { typingSpeed = 15, onComplete } = options;

    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const currentIndexRef = useRef(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const skipToEnd = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setDisplayedText(text);
        setIsTyping(false);
        setIsComplete(true);
        currentIndexRef.current = text.length;
        onComplete?.();
    }, [text, onComplete]);

    useEffect(() => {
        if (!shouldStart || !text) {
            return;
        }

        // Reset state when text changes
        setDisplayedText('');
        setIsTyping(true);
        setIsComplete(false);
        currentIndexRef.current = 0;

        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            if (currentIndexRef.current < text.length) {
                currentIndexRef.current += 1;
                setDisplayedText(text.slice(0, currentIndexRef.current));
            } else {
                // Typing complete
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                setIsTyping(false);
                setIsComplete(true);
                onComplete?.();
            }
        }, typingSpeed);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [text, shouldStart, typingSpeed, onComplete]);

    return {
        displayedText,
        isTyping,
        isComplete,
        skipToEnd,
    };
}

export default useTypingEffect;
