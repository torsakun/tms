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
    <div className="pdf-report-container p-8" style={{ backgroundColor: '#ffffff', color: '#1e293b', width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-2 pb-6 mb-6" style={{ borderColor: '#e2e8f0' }}>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#0f172a' }}>Test Run Report</h1>
        <h2 className="text-xl font-semibold" style={{ color: '#334155' }}>{run.title}</h2>
        <div className="mt-4 flex justify-between text-sm" style={{ color: '#64748b' }}>
          <div>
            <strong>Project:</strong> {projectCode}
          </div>
          <div>
            <strong>Date:</strong> {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="p-6 rounded-lg border mb-8 page-break-inside-avoid" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>Execution Summary</h3>
        <div className="flex justify-between items-center">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <span className="block text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Total Cases</span>
              <span className="text-xl font-bold" style={{ color: '#1e293b' }}>{total}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Duration</span>
              <span className="text-xl font-bold" style={{ color: '#1e293b' }}>{durationStr}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wider font-bold" style={{ color: '#16a34a' }}>Passed</span>
              <span className="text-xl font-bold" style={{ color: '#15803d' }}>{passed}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wider font-bold" style={{ color: '#ef4444' }}>Failed</span>
              <span className="text-xl font-bold" style={{ color: '#dc2626' }}>{failed}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wider font-bold" style={{ color: '#f59e0b' }}>Blocked / Skipped</span>
              <span className="text-xl font-bold" style={{ color: '#d97706' }}>{blocked + skipped}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wider font-bold" style={{ color: '#94a3b8' }}>Untested</span>
              <span className="text-xl font-bold" style={{ color: '#475569' }}>{untested}</span>
            </div>
          </div>
          <div className="text-center pr-8">
            <div className="text-[40px] font-black leading-none" style={{ color: '#1e293b' }}>{completionRate}%</div>
            <div className="text-sm font-medium mt-2" style={{ color: '#64748b' }}>Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Detailed Results Table */}
      <div>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#1e293b' }}>Detailed Results</h3>
        <table className="w-full text-left border-collapse border" style={{ borderColor: '#e2e8f0' }}>
          <thead>
            <tr className="text-sm" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
              <th className="border p-3 font-bold w-[12%]" style={{ borderColor: '#e2e8f0' }}>ID</th>
              <th className="border p-3 font-bold w-[20%]" style={{ borderColor: '#e2e8f0' }}>Test Case</th>
              <th className="border p-3 font-bold w-[10%]" style={{ borderColor: '#e2e8f0' }}>Status</th>
              <th className="border p-3 font-bold w-[25%]" style={{ borderColor: '#e2e8f0' }}>Expected Result</th>
              <th className="border p-3 font-bold w-[33%]" style={{ borderColor: '#e2e8f0' }}>Actual Result & Evidence</th>
            </tr>
          </thead>
          <tbody>
            {run.results?.map((res: any, index: number) => {
              const tc = res.testCase;
              const code = tc.code || `${projectCode}-${tc.id.substring(0, 4)}`;

              // Get Status styling
              let statusStyle = { color: '#64748b', fontWeight: 'normal' };
              let statusText = res.status;
              if (res.status === 'PASSED') statusStyle = { color: '#16a34a', fontWeight: 'bold' };
              if (res.status === 'FAILED') statusStyle = { color: '#dc2626', fontWeight: 'bold' };
              if (res.status === 'BLOCKED') statusStyle = { color: '#f59e0b', fontWeight: 'bold' };

              // Combine Expected Results
              const expected = (tc.steps || []).map((step: any, idx: number) => {
                const stepNum = idx + 1;
                return (
                  <div key={idx} className="mb-2 last:mb-0">
                    <span className="font-semibold text-xs" style={{ color: '#475569' }}>Step {stepNum}:</span>
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
                      <span className="font-semibold text-xs block mb-1" style={{ color: '#475569' }}>Step {stepNum} ({stepRes.status || 'N/A'}):</span>
                      {stepRes.actualResult && <div className="text-sm mb-2" style={{ color: '#334155' }}>{stepRes.actualResult}</div>}
                      
                      {stepRes.attachments && stepRes.attachments.map((att: any, attIdx: number) => (
                        <div key={`att-${idx}-${attIdx}`} className="mt-2">
                          {att.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <img src={att.url} alt="Evidence" className="max-w-full max-h-[200px] border rounded object-contain" style={{ borderColor: '#e2e8f0' }} crossOrigin="anonymous" />
                          ) : (
                            <a href={att.url} className="text-xs underline" style={{ color: '#3b82f6' }}>Attachment: {att.name || 'File'}</a>
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
                  <div key="global-msg" className="mb-2 text-sm" style={{ color: '#334155' }}>
                    {res.errorMessage || res.comment}
                  </div>
                );
              }
              if (res.attachments && Array.isArray(res.attachments)) {
                res.attachments.forEach((att: any, attIdx: number) => {
                  actualElements.push(
                    <div key={`global-att-${attIdx}`} className="mt-2">
                      {att.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                        <img src={att.url} alt="Evidence" className="max-w-full max-h-[200px] border rounded object-contain" style={{ borderColor: '#e2e8f0' }} crossOrigin="anonymous" />
                      ) : (
                        <a href={att.url} className="text-xs underline" style={{ color: '#3b82f6' }}>Attachment: {att.name || 'File'}</a>
                      )}
                    </div>
                  );
                });
              }

              return (
                <tr key={res.id} className="border-b" style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff', pageBreakInside: 'avoid' }}>
                  <td className="border p-3 align-top text-sm font-mono" style={{ borderColor: '#e2e8f0', color: '#475569' }}>{code}</td>
                  <td className="border p-3 align-top text-sm font-medium" style={{ borderColor: '#e2e8f0', color: '#1e293b' }}>{tc.title}</td>
                  <td className={`border p-3 align-top text-xs tracking-wider`} style={{ borderColor: '#e2e8f0', ...statusStyle }}>{statusText}</td>
                  <td className="border p-3 align-top" style={{ borderColor: '#e2e8f0' }}>
                    {expected.length > 0 ? expected : <span className="italic text-xs" style={{ color: '#94a3b8' }}>No specific expected result</span>}
                  </td>
                  <td className="border p-3 align-top" style={{ borderColor: '#e2e8f0' }}>
                    {actualElements.length > 0 ? actualElements : <span className="italic text-xs" style={{ color: '#94a3b8' }}>No actual result recorded</span>}
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
