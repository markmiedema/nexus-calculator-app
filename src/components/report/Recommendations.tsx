import React from 'react';
import { ProcessedData } from '../../types';
import { ClipboardList, AlertCircle, CheckCircle2, BookOpen, TrendingUp } from 'lucide-react';

interface RecommendationsProps {
  data: ProcessedData;
}

const Recommendations: React.FC<RecommendationsProps> = ({ data }) => {
  const { nexusStates, totalLiability, salesByState } = data;
  const hasNexus = nexusStates.length > 0;
  
  // Find states approaching nexus (>75% of threshold)
  const statesApproachingNexus = salesByState
    .filter(state => state.thresholdProximity >= 75 && !nexusStates.find(n => n.code === state.code))
    .sort((a, b) => b.thresholdProximity - a.thresholdProximity);
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {hasNexus ? 'Compliance Recommendations' : 'Monitoring Recommendations'}
        </h2>
        <p className="text-gray-600">
          {hasNexus 
            ? 'Based on our analysis of your sales data, we recommend the following actions to address your SALT nexus obligations and minimize potential tax liability.'
            : 'While you currently have no nexus obligations, we recommend the following actions to maintain compliance and prepare for future growth.'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className={`px-4 py-3 flex items-center border-b ${
            hasNexus ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'
          }`}>
            <ClipboardList className={`h-5 w-5 mr-2 ${hasNexus ? 'text-blue-600' : 'text-green-600'}`} />
            <h3 className={`font-medium ${hasNexus ? 'text-blue-800' : 'text-green-800'}`}>
              {hasNexus ? 'Immediate Actions' : 'Proactive Monitoring'}
            </h3>
          </div>
          
          <div className="p-4">
            <ul className="space-y-3">
              {hasNexus ? (
                <>
                  <li className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                      <span className="flex items-center justify-center h-4 w-4 text-blue-600 font-bold text-xs">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Register in States with Established Nexus</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Register for sales tax permits in all {nexusStates.length} states where nexus has been established,
                        prioritizing those with the earliest registration deadlines.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                      <span className="flex items-center justify-center h-4 w-4 text-blue-600 font-bold text-xs">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Calculate Back Taxes</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Work with a tax professional to calculate exact tax liabilities for each state
                        from the date nexus was established. Consider voluntary disclosure agreements
                        where appropriate.
                      </p>
                    </div>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                      <span className="flex items-center justify-center h-4 w-4 text-green-600 font-bold text-xs">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Establish Regular Review Schedule</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Set up quarterly reviews of your sales data to monitor nexus thresholds across all states
                        where you conduct business.
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                      <span className="flex items-center justify-center h-4 w-4 text-green-600 font-bold text-xs">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Monitor High-Activity States</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Pay special attention to states where sales are growing rapidly or approaching
                        50% of nexus thresholds.
                      </p>
                    </div>
                  </li>
                </>
              )}
              
              <li className="flex items-start">
                <div className={`rounded-full p-1 mr-3 mt-0.5 ${hasNexus ? 'bg-blue-100' : 'bg-green-100'}`}>
                  <span className={`flex items-center justify-center h-4 w-4 font-bold text-xs ${
                    hasNexus ? 'text-blue-600' : 'text-green-600'
                  }`}>3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {hasNexus ? 'Implement Tax Collection Systems' : 'Consider Automation Tools'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {hasNexus
                      ? 'Configure your e-commerce or point-of-sale systems to collect appropriate sales tax in each state where you have nexus.'
                      : 'Evaluate tax compliance software that can help track sales and provide early warnings as you approach nexus thresholds.'}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className={`px-4 py-3 flex items-center border-b ${
            hasNexus ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'
          }`}>
            <CheckCircle2 className={`h-5 w-5 mr-2 ${hasNexus ? 'text-green-600' : 'text-amber-600'}`} />
            <h3 className={`font-medium ${hasNexus ? 'text-green-800' : 'text-amber-800'}`}>
              {hasNexus ? 'Ongoing Compliance' : 'States to Watch'}
            </h3>
          </div>
          
          <div className="p-4">
            {hasNexus ? (
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                    <span className="flex items-center justify-center h-4 w-4 text-green-600 font-bold text-xs">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Monitor Sales by State</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Implement a system to regularly track sales by state to identify when new
                      nexus thresholds are approached or crossed.
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="bg-green-100 rounded-full p-1 mr-3 mt-0.5">
                    <span className="flex items-center justify-center h-4 w-4 text-green-600 font-bold text-xs">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Stay Updated on Tax Law Changes</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Subscribe to tax law updates or work with a tax professional to stay
                      informed about changes to nexus thresholds, tax rates, or filing requirements.
                    </p>
                  </div>
                </li>
              </ul>
            ) : (
              <div className="space-y-4">
                {statesApproachingNexus.length > 0 ? (
                  statesApproachingNexus.map(state => (
                    <div key={state.code} className="bg-amber-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <TrendingUp className="h-5 w-5 text-amber-600 mr-2" />
                          <span className="font-medium text-amber-900">{state.name}</span>
                        </div>
                        <span className="text-amber-600 font-medium">{state.thresholdProximity}%</span>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-amber-200 rounded-full h-2">
                          <div 
                            className="bg-amber-500 h-2 rounded-full" 
                            style={{ width: `${state.thresholdProximity}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-amber-800">
                        Current: ${state.totalRevenue.toLocaleString()} / Threshold: ${state.revenueThreshold.toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-sm">
                    No states are currently approaching nexus thresholds. Continue monitoring sales growth
                    across all active states.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-amber-50 px-4 py-3 flex items-center border-b border-amber-100">
          <BookOpen className="h-5 w-5 text-amber-600 mr-2" />
          <h3 className="text-amber-800 font-medium">Professional Assistance Recommendations</h3>
        </div>
        
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            {hasNexus
              ? `Given your estimated tax liability of $${totalLiability.toLocaleString()} across ${nexusStates.length} states,
                 we strongly recommend engaging professional tax assistance for the following areas:`
              : 'While you currently have no nexus obligations, consider the following professional services to ensure proper compliance monitoring:'}
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-800 mb-2">SALT Specialist</h4>
              <p className="text-sm text-gray-600">
                {hasNexus
                  ? 'Engage a tax professional specializing in state and local taxes to review your specific situation and provide tailored guidance.'
                  : 'Consult with a SALT specialist to develop a proactive compliance strategy as your business grows.'}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-800 mb-2">Tax Technology Consultant</h4>
              <p className="text-sm text-gray-600">
                {hasNexus
                  ? 'Work with a consultant to implement appropriate tax calculation and collection systems.'
                  : 'Evaluate tax compliance software options to automate threshold monitoring and ensure timely notifications.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0 mr-3" />
        <div>
          <h3 className="text-red-800 font-medium">Important Notice</h3>
          <p className="mt-1 text-sm text-red-700">
            This analysis is based on current understanding of state tax laws and is for informational
            purposes only. Tax laws change frequently, and states may have specific requirements not
            covered in this general analysis. All actions should be reviewed by a qualified tax
            professional before implementation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;