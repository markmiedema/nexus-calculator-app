import React from 'react';
import { BarChart3 } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl text-gray-800">SALT Nexus Calculator</span>
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <a href="#" className="text-gray-600 hover:text-blue-600 text-sm font-medium">
                Documentation
              </a>
            </li>
            <li>
              <a href="#" className="text-gray-600 hover:text-blue-600 text-sm font-medium">
                Support
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;