import React from 'react';
import { ProcessedData } from '../../types';
import { AlertCircle, TrendingUp, DollarSign, MapPin, Calendar, AlertTriangle } from 'lucide-react';

interface ExecutiveSummaryProps {
  data: ProcessedData;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ data }) => {
  const { nexusStates, totalLiability, priorityStates, dataRange, salesByState } = data;
  const hasNexus = nexusStates.length > 0;
  
  // Calculate overdue registrations
  const overdueRegistrations = nexusStates.filter(state => {
    const daysUntilDeadline = Math.ceil(
      (new Date(state.registrationDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDeadline <= 0;
  });

  // Calculate max days overdue
  const maxDaysOverdue = Math.max(
    0,
    ...nexusStates.map(state => {
      const daysUntilDeadline = Math.ceil(
        (new Date(state.registrationDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return -daysUntilDeadline;
    })
  );
  
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-2">Sales & Use Tax Nexus Analysis</h1>
        <p className="text-gray-600 text-lg">Comprehensive Multi-State Compliance Assessment</p>
        <p className="text-gray-500 mt-2">
          Analysis Period: {new Date(dataRange.start).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
          })} - {new Date(dataRange.end).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
          })}
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
          <div className="text-3xl font-bold text-red-600 mb-2">
            ${totalLiability.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            Estimated Liability
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {nexusStates.length}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            States with Nexus
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
          <div className="text-3xl font-bold text-red-600 mb-2">
            {overdueRegistrations.length}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            Overdue Registrations
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {maxDaysOverdue}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            Max Days Overdue
          </div>
        </div>
      </div>

      {/* Priority State Analysis */}
      {hasNexus && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Priority State Analysis</h2>
            <p className="text-sm text-gray-500 mt-1">
              All registrations overdue • Immediate action required
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nexus Established
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Overdue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Liability
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {priorityStates.slice(0, 5).map((state) => {
                  const daysUntilDeadline = Math.ceil(
                    (new Date(state.registrationDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const daysOverdue = Math.max(0, -daysUntilDeadline);

                  return (
                    <tr key={state.code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {state.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(state.nexusDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(state.registrationDeadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {daysOverdue > 0 ? daysOverdue : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${state.totalRevenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {state.taxRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <span className="w-2 h-2 bg-red-600 rounded-full mr-1.5"></span>
                          Critical
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ${state.liability.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estimated Tax Liability Chart */}
      {hasNexus && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Estimated Tax Liability by State</h3>
          
          <div className="space-y-4">
            {priorityStates.slice(0, 5).map((state) => {
              const maxLiability = Math.max(...priorityStates.slice(0, 5).map(s => s.liability));
              const percentage = (state.liability / maxLiability) * 100;
              
              return (
                <div key={state.code} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{state.name}</span>
                    <span className="text-sm font-bold text-gray-900">
                      ${state.liability.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div 
                      className="bg-red-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${percentage}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        ${(state.liability / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compliance Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-gray-800">Compliance Recommendations</h3>
          <span className="text-sm text-gray-500">Prioritized action plan</span>
        </div>

        <div className="space-y-6">
          {hasNexus ? (
            <>
              <div>
                <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-3">
                  Immediate Actions (0-30 Days)
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    Initiate voluntary disclosure agreements across all {nexusStates.length} states
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    Engage AST's nexus tax counsel network for penalty mitigation
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    Implement immediate compliance hold on non-registered state sales
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    Deploy AST's automated tax collection procedures
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    Complete precise liability calculation with penalty assessment
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Long-Term Compliance (30-90 Days)
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    Implement AST's best-of-breed tax automation platform
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    Establish systematic revenue monitoring across all jurisdictions
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    Deploy AST's comprehensive compliance calendar system
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    Activate post-Wayfair nexus threshold monitoring
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    Implement quarterly nexus assessment protocols
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div>
              <h4 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-3">
                Proactive Monitoring
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Continue tracking sales by state on monthly basis
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Set up alerts for states approaching 75% of nexus thresholds
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Review nexus thresholds quarterly for any changes
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  Prepare tax collection systems for future nexus
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Financial Impact Analysis */}
      {hasNexus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
            <div className="text-2xl font-bold text-red-600 mb-2">
              ${Math.round(totalLiability * 0.8).toLocaleString()} - ${Math.round(totalLiability * 1.2).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              Estimated Back Tax Liability
            </div>
            <div className="text-xs text-gray-400 mt-1">
              (Includes interest & penalties)
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-800">
            <div className="text-2xl font-bold text-gray-800 mb-2">
              ${(nexusStates.length * 2000).toLocaleString()} - ${(nexusStates.length * 3000).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              Compliance Implementation Costs
            </div>
            <div className="text-xs text-gray-400 mt-1">
              (Registration, software, filing)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveSummary;