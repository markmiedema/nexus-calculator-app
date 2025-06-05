import React from 'react';

interface StateMapProps {
  nexusStates: string[];
}

const StateMap: React.FC<StateMapProps> = ({ nexusStates }) => {
  // This is a simplified component that would show a map of the US with nexus states highlighted
  // In a real implementation, this would use a mapping library like react-simple-maps or a similar solution
  
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="text-center mb-4">
        <p className="text-gray-500 text-sm">U.S. States with Nexus Established</p>
        <p className="font-medium text-blue-600">{nexusStates.length} States</p>
      </div>
      
      <div className="w-full h-44 bg-gray-100 rounded-md flex items-center justify-center">
        <p className="text-gray-400 text-sm">
          Interactive U.S. map would render here, highlighting the following states with nexus:
        </p>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-1 justify-center">
        {nexusStates.map(state => (
          <span key={state} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            {state}
          </span>
        ))}
      </div>
    </div>
  );
};

export default StateMap;