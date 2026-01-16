import { Bot, Sparkles } from 'lucide-react';

interface AIAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
  xl: 'w-10 h-10',
};

const badgeSizes = {
  sm: 'w-3 h-3 text-[6px]',
  md: 'w-4 h-4 text-[8px]',
  lg: 'w-5 h-5 text-[10px]',
  xl: 'w-6 h-6 text-xs',
};

export default function AIAvatar({ size = 'md', className = '' }: AIAvatarProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Main avatar circle with gradient */}
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/40 ring-2 ring-white/50`}>
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
        
        {/* Bot icon */}
        <Bot className={`${iconSizes[size]} text-white drop-shadow-sm relative z-10`} />
        
        {/* Animated sparkle effect */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute top-0 left-1/4 w-1 h-1 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '0s', animationDuration: '2s' }} />
          <div className="absolute top-1/4 right-0 w-0.5 h-0.5 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s', animationDuration: '2s' }} />
          <div className="absolute bottom-1/4 left-0 w-0.5 h-0.5 bg-white rounded-full animate-ping opacity-75" style={{ animationDelay: '1s', animationDuration: '2s' }} />
        </div>
      </div>

      {/* AI Badge */}
      <div className={`absolute -bottom-0.5 -right-0.5 ${badgeSizes[size]} rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-md border border-white`}>
        <Sparkles className={size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      </div>
    </div>
  );
}
