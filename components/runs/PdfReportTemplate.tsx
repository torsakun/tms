import React from 'react';

interface PdfReportTemplateProps {
  run: any;
  projectCode: string;
}

export function PdfReportTemplate({ run, projectCode }: PdfReportTemplateProps) {
  // Calculate summary metrics
  const total = run.results?.length || 0;
  const passed = run.results?.filter((r: any) => r.status === 'PASSED').length || 0;
  const failed = run.results?.filter((r: any) => r.status === 'FAILED').length || 0;
  const blocked = run.results?.filter((r: any) => r.status === 'BLOCKED').length || 0;
  const skipped = run.results?.filter((r: any) => r.status === 'SKIPPED').length || 0;
  const untested = run.results?.filter((r: any) => r.status === 'UNTESTED' || r.status === 'IN_PROGRESS').length || 0;
  
  const completionRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  // Format total duration
  const totalTimeSpent = run.results?.reduce((sum: number, r: any) => sum + (r.timeSpent || 0), 0) || 0;
  const minutes = Math.floor(totalTimeSpent / 60000);
  const seconds = Math.floor((totalTimeSpent % 60000) / 1000);
  const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="pdf-report-container p-8 bg-white text-slate-800" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-2 border-slate-200 pb-6 mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Test Run Report</h1>
        <h2 className="text-xl font-semibold text-slate-700">{run.title}</h2>
        <div className="mt-4 flex justify-between text-sm text-slate-500">
          <div>
            <strong>Project:</strong> {projectCode}
          </div>
          <div>
            <strong>Date:</strong> {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 page-break-inside-avoid">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Execution Summary</h3>
        <div className="flex justify-between items-center">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <span className="text-slate-500 block text-xs uppercase tracking-wider">Total Cases</span>
              <span className="text-xl font-bold text-slate-800">{total}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs uppercase tracking-wider">Duration</span>
              <span className="text-xl font-bold text-slate-800">{durationStr}</span>
            </div>
            <div>
              <span className="text-green-600 block text-xs uppercase tracking-wider font-bold">Passed</span>
              <span className="text-xl font-bold text-green-700">{passed}</span>
            </div>
            <div>
              <span className="text-red-500 block text-xs uppercase tracking-wider font-bold">Failed</span>
              <span className="text-xl font-bold text-red-600">{failed}</span>
            </div>
            <div>
              <span className="text-amber-500 block text-xs uppercase tracking-wider font-bold">Blocked / Skipped</span>
              <span className="text-xl font-bold text-amber-600">{blocked + skipped}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs uppercase tracking-wider font-bold">Untested</span>
              <span className="text-xl font-bold text-slate-600">{untested}</span>
            </div>
          </div>
          <div className="text-center pr-8">
            <div className="text-[40px] font-black text-slate-800 leading-none">{completionRate}%</div>
            <div className="text-sm font-medium text-slate-500 mt-2">Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Detailed Results Table */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Detailed Results</h3>
        <table className="w-full text-left border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-sm">
              <th className="border border-slate-200 p-3 font-bold w-[12%]">ID</th>
              <th className="border border-slate-200 p-3 font-bold w-[20%]">Test Case</th>
              <th className="border border-slate-200 p-3 font-bold w-[10%]">Status</th>
              <th className="border border-slate-200 p-3 font-bold w-[25%]">Expected Result</th>
              <th className="border border-slate-200 p-3 font-bold w-[33%]">Actual Result & Evidence</th>
            </tr>
          </thead>
          <tbody>
            {run.results?.map((res: any, index: number) => {
              const tc = res.testCase;
              const code = tc.code || `${projectCode}-${tc.id.substring(0, 4)}`;

              // Get Status styling
              let statusColor = "text-slate-500";
              let statusText = res.status;
              if (res.status === 'PASSED') statusColor = "text-green-600 font-bold";
              if (res.status === 'FAILED') statusColor = "text-red-600 font-bold";
              if (res.status === 'BLOCKED') statusColor = "text-amber-500 font-bold";

              // Combine Expected Results
              const expected = (tc.steps || []).map((step: any, idx: number) => {
                const stepNum = idx + 1;
                return (
                  <div key={idx} className="mb-2 last:mb-0">
                    <span className="font-semibold text-xs text-slate-600">Step {stepNum}:</span>
                    <div className="text-sm">{step.expectedResult || step.action}</div>
                  </div>
                );
              });

              // Combine Actual Results & Evidence
              const actualElements: React.ReactNode[] = [];
              
              (tc.steps || []).forEach((step: any, idx: number) => {
                const stepNum = idx + 1;
                const stepRes = (res.stepResults && res.stepResults[step.id]) || {};
                
                if (stepRes.actualResult || (stepRes.attachments && stepRes.attachments.length > 0)) {
                  actualElements.push(
                    <div key={`actual-${idx}`} className="mb-4 last:mb-0">
                      <span className="font-semibold text-xs text-slate-600 block mb-1">Step {stepNum} ({stepRes.status || 'N/A'}):</span>
                      {stepRes.actualResult && <div className="text-sm mb-2 text-slate-700">{stepRes.actualResult}</div>}
                      
                      {stepRes.attachments && stepRes.attachments.map((att: any, attIdx: number) => (
                        <div key={`att-${idx}-${attIdx}`} className="mt-2">
                          {att.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <img src={att.url} alt="Evidence" className="max-w-full max-h-[200px] border border-slate-200 rounded object-contain" crossOrigin="anonymous" />
                          ) : (
                            <a href={att.url} className="text-blue-500 text-xs underline">Attachment: {att.name || 'File'}</a>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }
              });

              // Add global attachments and comments if any
              if (res.errorMessage || res.comment) {
                actualElements.push(
                  <div key="global-msg" className="mb-2 text-sm text-slate-700">
                    {res.errorMessage || res.comment}
                  </div>
                );
              }
              if (res.attachments && Array.isArray(res.attachments)) {
                res.attachments.forEach((att: any, attIdx: number) => {
                  actualElements.push(
                    <div key={`global-att-${attIdx}`} className="mt-2">
                      {att.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                        <img src={att.url} alt="Evidence" className="max-w-full max-h-[200px] border border-slate-200 rounded object-contain" crossOrigin="anonymous" />
                      ) : (
                        <a href={att.url} className="text-blue-500 text-xs underline">Attachment: {att.name || 'File'}</a>
                      )}
                    </div>
                  );
                });
              }

              return (
                <tr key={res.id} className="border-b border-slate-200 bg-white" style={{ pageBreakInside: 'avoid' }}>
                  <td className="border border-slate-200 p-3 align-top text-sm font-mono text-slate-600">{code}</td>
                  <td className="border border-slate-200 p-3 align-top text-sm text-slate-800 font-medium">{tc.title}</td>
                  <td className={`border border-slate-200 p-3 align-top text-xs tracking-wider ${statusColor}`}>{statusText}</td>
                  <td className="border border-slate-200 p-3 align-top">
                    {expected.length > 0 ? expected : <span className="text-slate-400 italic text-xs">No specific expected result</span>}
                  </td>
                  <td className="border border-slate-200 p-3 align-top">
                    {actualElements.length > 0 ? actualElements : <span className="text-slate-400 italic text-xs">No actual result recorded</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
