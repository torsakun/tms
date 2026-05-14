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
    <div className="pdf-report-container" style={{ backgroundColor: '#ffffff', color: '#1e293b', width: '100%', minHeight: '100%', fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* Premium Dark Header */}
      <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '40px', borderBottom: '4px solid #3b82f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>TEST RUN REPORT</h1>
            <h2 style={{ fontSize: '20px', fontWeight: '400', color: '#94a3b8', margin: 0 }}>{run.title}</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>PROJECT</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{projectCode}</div>
          </div>
        </div>
        <div style={{ marginTop: '30px', fontSize: '14px', color: '#cbd5e1' }}>
          <strong>Generated on:</strong> {new Date().toLocaleString()}
        </div>
      </div>

      <div style={{ padding: '40px' }}>
        {/* Summary Dashboard */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '40px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px 0' }}>Executive Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', flex: 1 }}>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #64748b' }}>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '4px' }}>Total Cases</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{total}</span>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #16a34a' }}>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#16a34a', marginBottom: '4px', fontWeight: '700' }}>Passed</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#15803d' }}>{passed}</span>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #dc2626' }}>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#ef4444', marginBottom: '4px', fontWeight: '700' }}>Failed</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#b91c1c' }}>{failed}</span>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '4px' }}>Duration</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{durationStr}</span>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #f59e0b' }}>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#f59e0b', marginBottom: '4px', fontWeight: '700' }}>Blocked/Skipped</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#b45309' }}>{blocked + skipped}</span>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #94a3b8' }}>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '4px', fontWeight: '700' }}>Untested</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#475569' }}>{untested}</span>
              </div>
            </div>
            
            {/* Circular Progress (Static Approximation) */}
            <div style={{ width: '160px', textAlign: 'center', paddingLeft: '32px' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto', borderRadius: '50%', background: `conic-gradient(#16a34a ${completionRate}%, #e2e8f0 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100px', height: '100px', backgroundColor: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', lineHeight: '1' }}>{completionRate}%</span>
                </div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Completion</div>
            </div>
          </div>
        </div>

        {/* Detailed Results Table */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0' }}>Detailed Test Execution</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                <th style={{ padding: '14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', width: '20%', border: '1px solid #334155' }}>Test Case</th>
                <th style={{ padding: '14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', width: '25%', border: '1px solid #334155' }}>Test Step</th>
                <th style={{ padding: '14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', width: '25%', border: '1px solid #334155' }}>Expected Result</th>
                <th style={{ padding: '14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600', width: '30%', border: '1px solid #334155' }}>Actual Result & Evidence</th>
              </tr>
            </thead>
            <tbody>
              {run.results?.map((res: any, index: number) => {
                const tc = res.testCase;
                const code = tc.code || `${projectCode}-${tc.id.substring(0, 4)}`;
                const rowBgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';

                // Status Badge styling
                let badgeBg = '#f1f5f9', badgeColor = '#64748b';
                if (res.status === 'PASSED') { badgeBg = '#dcfce7'; badgeColor = '#16a34a'; }
                if (res.status === 'FAILED') { badgeBg = '#fee2e2'; badgeColor = '#dc2626'; }
                if (res.status === 'BLOCKED') { badgeBg = '#fef3c7'; badgeColor = '#d97706'; }

                // Global attachments and comments
                const globalElements: React.ReactNode[] = [];
                if (res.errorMessage) {
                  globalElements.push(
                    <div key="global-err" style={{ fontSize: '13px', color: '#dc2626', backgroundColor: '#fee2e2', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #ef4444', marginBottom: '8px' }}>
                      <strong style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Error Message:</strong>
                      {res.errorMessage}
                    </div>
                  );
                }
                if (res.comment) {
                  globalElements.push(
                    <div key="global-comment" style={{ fontSize: '13px', color: '#334155', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #94a3b8', marginBottom: '8px' }}>
                      <strong style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Comment:</strong>
                      {res.comment}
                    </div>
                  );
                }
                if (res.attachments && Array.isArray(res.attachments)) {
                  res.attachments.forEach((att: any, attIdx: number) => {
                    globalElements.push(
                      <div key={`global-att-${attIdx}`} style={{ marginTop: '8px' }}>
                        {att.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                          <img src={att.url} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'block' }} crossOrigin="anonymous" />
                        ) : (
                          <a href={att.url} style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', borderBottom: '1px solid #3b82f6' }}>📄 Attachment: {att.name || 'File'}</a>
                        )}
                      </div>
                    );
                  });
                }

                return (
                  <tr key={res.id} style={{ backgroundColor: rowBgColor, pageBreakInside: 'avoid' }}>
                    {/* Column 1: Test Case */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '16px', verticalAlign: 'top', width: '20%' }}>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b', marginBottom: '4px' }}>{code}</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '12px', lineHeight: '1.4' }}>{tc.title}</div>
                      <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', backgroundColor: badgeBg, color: badgeColor }}>
                        {res.status}
                      </span>
                    </td>
                    
                    {/* Columns 2, 3, 4: Inner table for Steps */}
                    <td colSpan={3} style={{ border: '1px solid #e2e8f0', padding: '0', verticalAlign: 'top', width: '80%' }}>
                      {(tc.steps && tc.steps.length > 0) ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', height: '100%' }}>
                          <tbody>
                            {tc.steps.map((step: any, idx: number) => {
                              const stepNum = idx + 1;
                              const stepRes = (res.stepResults && res.stepResults[step.id]) || {};
                              const isLastStep = idx === tc.steps.length - 1;
                              const stepBorderBottom = (isLastStep && globalElements.length === 0) ? 'none' : '1px solid #e2e8f0';

                              return (
                                <tr key={idx}>
                                  {/* Step Action */}
                                  <td style={{ borderBottom: stepBorderBottom, borderRight: '1px solid #e2e8f0', padding: '16px', verticalAlign: 'top', width: '31.25%' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Step {stepNum}</div>
                                    <div style={{ fontSize: '13px', color: '#334155' }}>{step.action}</div>
                                  </td>
                                  
                                  {/* Step Expected */}
                                  <td style={{ borderBottom: stepBorderBottom, borderRight: '1px solid #e2e8f0', padding: '16px', verticalAlign: 'top', width: '31.25%' }}>
                                    <div style={{ fontSize: '13px', color: '#475569' }}>{step.expectedResult || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>None</span>}</div>
                                  </td>
                                  
                                  {/* Step Actual */}
                                  <td style={{ borderBottom: stepBorderBottom, padding: '16px', verticalAlign: 'top', width: '37.5%' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Status: {stepRes.status || 'N/A'}</div>
                                    {stepRes.actualResult && <div style={{ fontSize: '13px', color: '#334155', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>{stepRes.actualResult}</div>}
                                    {stepRes.attachments && stepRes.attachments.map((att: any, attIdx: number) => (
                                      <div key={`att-${idx}-${attIdx}`} style={{ marginTop: '8px' }}>
                                        {att.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                          <img src={att.url} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'block' }} crossOrigin="anonymous" />
                                        ) : (
                                          <a href={att.url} style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', borderBottom: '1px solid #3b82f6' }}>📄 Attachment: {att.name || 'File'}</a>
                                        )}
                                      </div>
                                    ))}
                                    {!stepRes.actualResult && (!stepRes.attachments || stepRes.attachments.length === 0) && (
                                      <span style={{ fontStyle: 'italic', fontSize: '13px', color: '#cbd5e1' }}>No actual result</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            
                            {/* Render Global Elements if any */}
                            {globalElements.length > 0 && (
                              <tr>
                                <td colSpan={3} style={{ padding: '16px', verticalAlign: 'top', backgroundColor: 'rgba(241, 245, 249, 0.5)' }}>
                                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Global Notes & Evidence</div>
                                  {globalElements}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ padding: '16px' }}>
                          <span style={{ fontStyle: 'italic', fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: globalElements.length > 0 ? '16px' : '0' }}>No test steps defined</span>
                          {globalElements.length > 0 && globalElements}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
          Confidential - Generated by QMaster Test Management System
        </div>
      </div>
    </div>
  );
}
