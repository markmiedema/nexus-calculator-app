import React from 'react';
import { ProcessedData } from '../../types';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface ComplianceTimelineProps {
  data: ProcessedData;
}

const ComplianceTimeline: React.FC<ComplianceTimelineProps> = ({ data }) => {
  const { nexusStates } = data;
  
  // Sort states by registration deadline
  const sortedStates = [...nexusStates].sort((a, b) => {
    const dateA = new Date(a.registrationDeadline);
    const dateB = new Date(b.registrationDeadline);
    return dateA.getTime() - dateB.getTime();
  });

  // Group states by urgency (30 days, 60 days, 90+ days)
  const currentDate = new Date();
  const urgentStates = [];
  const soonStates = [];
  const laterStates = [];

  for (const state of sortedStates) {
    const deadline = new Date(state.registrationDeadline);
    const daysUntilDeadline = Math.ceil((deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline <= 30) {
      urgentStates.push({ ...state, daysRemaining: daysUntilDeadline });
    } else if (daysUntilDeadline <= 60) {
      soonStates.push({ ...state, daysRemaining: daysUntilDeadline });
    } else {
      laterStates.push({ ...state, daysRemaining: daysUntilDeadline });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Compliance Timeline</h2>
        <p className="text-gray-600">
          The timeline below shows registration deadlines for states where you have established nexus.
          States are grouped by urgency to help prioritize your compliance efforts.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-red-50 rounded-lg shadow-sm border border-red-100 overflow-hidden">
          <div className="bg-red-100 px-4 py-3 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-red-800 font-medium">Urgent (Next 30 Days)</h3>
          </div>
          
          <div className="p-4">
            {urgentStates.length > 0 ? (
              <div className="space-y-3">
                {urgentStates.map((state) => (
                  <div key={state.code} className="bg-white rounded-md p-3 shadow-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-800">{state.name}</span>
                      <span className="text-red-600 font-medium">
                        {state.daysRemaining <= 0 
                          ? 'Overdue!' 
                          : `${state.daysRemaining} days`}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Deadline: {state.registrationDeadline}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Filing: {state.filingFrequency}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No urgent registrations due</p>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-100 overflow-hidden">
          <div className="bg-yellow-100 px-4 py-3 flex items-center">
            <Clock className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-yellow-800 font-medium">Coming Soon (31-60 Days)</h3>
          </div>
          
          <div className="p-4">
            {soonStates.length > 0 ? (
              <div className="space-y-3">
                {soonStates.map((state) => (
                  <div key={state.code} className="bg-white rounded-md p-3 shadow-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-800">{state.name}</span>
                      <span className="text-yellow-600 font-medium">{state.daysRemaining} days</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Deadline: {state.registrationDeadline}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Filing: {state.filingFrequency}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No registrations due in this period</p>
            )}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg shadow-sm border border-green-100 overflow-hidden">
          <div className="bg-green-100 px-4 py-3 flex items-center">
            <Calendar className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-green-800 font-medium">Later (60+ Days)</h3>
          </div>
          
          <div className="p-4">
            {laterStates.length > 0 ? (
              <div className="space-y-3">
                {laterStates.map((state) => (
                  <div key={state.code} className="bg-white rounded-md p-3 shadow-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-800">{state.name}</span>
                      <span className="text-green-600 font-medium">{state.daysRemaining} days</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Deadline: {state.registrationDeadline}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Filing: {state.filingFrequency}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic">No registrations due in this period</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="text-blue-800 font-medium">Registration Requirements</h3>
        <div className="mt-2 text-sm">
          <p className="text-blue-700 mb-2">
            Most states require registration within 30-90 days of establishing nexus. 
            Registration typically involves:
          </p>
          <ul className="text-blue-700 space-y-1 list-disc pl-5">
            <li>Completing a registration application with the state's Department of Revenue</li>
            <li>Providing business information including EIN, address, and business type</li>
            <li>Disclosing the date nexus was established</li>
            <li>Paying registration fees (if applicable)</li>
            <li>Setting up filing frequency and payment methods</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ComplianceTimeline;