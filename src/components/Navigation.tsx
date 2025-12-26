import { useStacksWallet } from '@/hooks/useStacksWallet';
import { WalletConnect } from './WalletConnect';
import { AccountButton } from './AccountButton';
import { ThemeToggle } from './ThemeToggle';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  extraActions?: React.ReactNode;
}

export function Navigation({ currentPage, onPageChange, extraActions }: NavigationProps) {
  const { isAuthenticated } = useStacksWallet();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'setup', label: 'Setup', icon: '⚙️' },
    { id: 'history', label: 'History', icon: '📜' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-stacks-blue dark:text-blue-400 transition-colors duration-200">
              Bitcoin Savings App
            </h1>
            
            {isAuthenticated && (
              <div className="hidden md:flex space-x-1" role="tablist" aria-label="Navigation tabs">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stacks-blue focus:ring-offset-2 dark:focus:ring-offset-gray-800 transform hover:-translate-y-0.5 ${
                      currentPage === item.id
                        ? 'bg-stacks-blue text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    role="tab"
                    aria-selected={currentPage === item.id}
                    aria-controls={`${item.id}-panel`}
                    tabIndex={currentPage === item.id ? 0 : -1}
                  >
                    <span className="mr-2" aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {extraActions}
            <ThemeToggle />
            {isAuthenticated ? <AccountButton /> : <WalletConnect />}
          </div>
        </div>
        
        {/* Mobile navigation */}
        {isAuthenticated && (
          <div className="md:hidden pb-3" role="tablist" aria-label="Mobile navigation tabs">
            <div className="flex space-x-1 overflow-x-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-stacks-blue focus:ring-offset-2 dark:focus:ring-offset-gray-800 transform hover:-translate-y-0.5 ${
                    currentPage === item.id
                      ? 'bg-stacks-blue text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  role="tab"
                  aria-selected={currentPage === item.id}
                  aria-controls={`${item.id}-panel`}
                  tabIndex={currentPage === item.id ? 0 : -1}
                >
                  <span className="mr-2" aria-hidden="true">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
