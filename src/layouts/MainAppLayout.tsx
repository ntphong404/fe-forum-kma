import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainAppLayoutProps {
  header: ReactNode; // Header component (fixed at top)
  leftSidebar?: ReactNode; // Left sidebar (scrollable)
  rightSidebar?: ReactNode; // Right sidebar (scrollable)
  children: ReactNode; // Main content (scrollable)
  leftSidebarWidth?: string; // Default: 280px
  rightSidebarWidth?: string; // Default: 320px
}

/**
 * MainAppLayout - Full-page layout with fixed header and 3-column scrollable content
 * 
 * Structure:
 * ┌─────────────────────────────────┐
 * │         FIXED HEADER            │ (height: auto)
 * ├────────────┬─────────────┬──────┤
 * │   Left     │   Main      │Right │
 * │ Sidebar    │  Content    │Side  │
 * │ (scroll)   │  (scroll)   │(scrl)│
 * │            │             │      │
 * ├────────────┴─────────────┴──────┤
 * └─────────────────────────────────┘
 * 
 * - Total height = 100vh
 * - Header height is auto
 * - Content area = 100vh - header height
 * - Each section has independent scroll
 * - Responsive: Sidebars hidden on mobile, shown as overlay
 */
export default function MainAppLayout({
  header,
  leftSidebar,
  rightSidebar,
  children,
  leftSidebarWidth = '280px',
  rightSidebarWidth = '320px',
}: MainAppLayoutProps) {
  const [showMobileLeftSidebar, setShowMobileLeftSidebar] = useState(false);
  const [showMobileRightSidebar, setShowMobileRightSidebar] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-white overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 border-b border-slate-200/80">
        {header}
      </div>

      {/* Main Content Area - Flexible Height with 3 Columns */}
      <div className="flex flex-1 overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 relative">

        {/* Mobile Overlay */}
        {(showMobileLeftSidebar || showMobileRightSidebar) && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => {
              setShowMobileLeftSidebar(false);
              setShowMobileRightSidebar(false);
            }}
          />
        )}

        {/* Left Sidebar - Hidden on mobile, shown as overlay */}
        {leftSidebar && (
          <>
            {/* Desktop Left Sidebar */}
            <div
              className="hidden lg:flex flex-col border-r border-slate-200/50 bg-white/50 backdrop-blur-sm overflow-hidden"
              style={{ width: leftSidebarWidth }}
            >
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-4">
                  {leftSidebar}
                </div>
              </div>
            </div>

            {/* Mobile Left Sidebar - Overlay */}
            <div
              className={`fixed left-0 top-0 h-full z-50 flex flex-col border-r border-slate-200/50 bg-white overflow-hidden transform transition-transform duration-300 ease-in-out lg:hidden ${showMobileLeftSidebar ? 'translate-x-0' : '-translate-x-full'
                }`}
              style={{ width: '280px' }}
            >
              <div className="flex items-center justify-between p-2 border-b border-slate-100">
                <Link
                  to="/forum"
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => setShowMobileLeftSidebar(false)}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Forum KMA
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileLeftSidebar(false)}
                  className="h-8 w-8 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-3">
                  {leftSidebar}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200 lg:hidden">
            {leftSidebar && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileLeftSidebar(true)}
                className="h-9 w-9 hover:bg-slate-100 rounded-xl"
              >
                <Menu className="w-5 h-5 text-slate-700" />
              </Button>
            )}
            <span className="flex-1" />
            {rightSidebar && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileRightSidebar(true)}
                className="h-9 w-9 hover:bg-blue-50 rounded-xl"
              >
                <Users className="w-5 h-5 text-slate-700" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile & tablet */}
        {rightSidebar && (
          <>
            {/* Desktop Right Sidebar */}
            <div
              className="hidden xl:flex flex-col border-l border-slate-200/50 bg-white/50 backdrop-blur-sm overflow-hidden"
              style={{ width: rightSidebarWidth }}
            >
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-4">
                  {rightSidebar}
                </div>
              </div>
            </div>

            {/* Mobile Right Sidebar - Overlay */}
            <div
              className={`fixed right-0 top-0 h-full z-50 flex flex-col border-l border-slate-200/50 bg-white overflow-hidden transform transition-transform duration-300 ease-in-out xl:hidden ${showMobileRightSidebar ? 'translate-x-0' : 'translate-x-full'
                }`}
              style={{ width: '300px', maxWidth: '85vw' }}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <span className="font-semibold text-slate-900">Bạn bè</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileRightSidebar(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-4">
                  {rightSidebar}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
