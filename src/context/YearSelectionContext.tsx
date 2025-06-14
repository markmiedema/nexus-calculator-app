import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { YearSelectionContextType } from '../types';

const YearSelectionContext = createContext<YearSelectionContextType | undefined>(undefined);

interface YearSelectionProviderProps {
  children: ReactNode;
  availableYears: string[];
}

export const YearSelectionProvider: React.FC<YearSelectionProviderProps> = ({ children, availableYears }) => {
  const [selectedYears, setSelectedYears] = useState<string[]>(availableYears || []);

  const toggleYear = useCallback((year: string) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year].sort()
    );
  }, []);

  const selectAllYears = useCallback(() => {
    setSelectedYears(availableYears || []);
  }, [availableYears]);

  const clearAllYears = useCallback(() => {
    setSelectedYears([]);
  }, []);

  return (
    <YearSelectionContext.Provider value={{
      selectedYears,
      availableYears: availableYears || [],
      toggleYear,
      selectAllYears,
      clearAllYears,
    }}>
      {children}
    </YearSelectionContext.Provider>
  );
};

export const useYearSelection = () => {
  const context = useContext(YearSelectionContext);
  if (context === undefined) {
    throw new Error('useYearSelection must be used within a YearSelectionProvider');
  }
  return context;
};