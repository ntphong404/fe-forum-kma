import { ReactNode } from 'react';

interface AppLayoutProps {
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  children: ReactNode;
  leftSidebarWidth?: string; // Default: 320px
  rightSidebarWidth?: string; // Default: 320px
}

/**
 * AppLayout - 3-column layout with fixed viewport height
 * 
 * Features:
 * - Fixed height = 100vh (full viewport height)
 * - Left sidebar (optional) - scrollable if content overflows
 * - Center content - scrollable if content overflows
 * - Right sidebar (optional) - scrollable if content overflows
 * - Each section has independent scrolling
 */
export default function AppLayout({
  leftSidebar,
  rightSidebar,
  children,
  leftSidebarWidth = '320px',
  rightSidebarWidth = '320px',
}: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen bg-white">
      {/* Left Sidebar */}
      {leftSidebar && (
        <div
          className="flex flex-col border-r border-slate-200/50 bg-white/50 backdrop-blur-sm overflow-hidden"
          style={{ width: leftSidebarWidth }}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {leftSidebar}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>

      {/* Right Sidebar */}
      {rightSidebar && (
        <div
          className="flex flex-col border-l border-slate-200/50 bg-white/50 backdrop-blur-sm overflow-hidden"
          style={{ width: rightSidebarWidth }}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {rightSidebar}
          </div>
        </div>
      )}
    </div>
  );
}
