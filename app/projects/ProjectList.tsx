"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, LayoutList, Grid, MoreVertical, AlertTriangle, Check, Settings, Archive } from "lucide-react";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval >= 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
}

interface ProjectData {
  id: string;
  name: string;
  code: string;
  testCasesCount: number;
  suitesCount: number;
  activeRunsCount: number;
  testRunsCount: number;
  milestonesCount: number;
  teamMembers: number;
  automationPercent: number;
  latestRunPassRate: number | null;
  updatedAt: string;
}

interface ProjectListProps {
  initialProjects: ProjectData[];
}

export function ProjectList({ initialProjects }: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProjects = initialProjects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 flex-1">
          <Link 
            href="?create=true"
            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition shadow-sm"
          >
            Create new project
          </Link>
          
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-text-muted" size={16} />
            <input 
              type="text" 
              aria-label="Search projects"
              placeholder="Search for projects"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border-none bg-surface text-text-main rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-colors"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button className="bg-surface text-text-main shadow-[0_2px_10px_rgba(0,0,0,0.03)] px-4 py-2 rounded-md text-sm font-medium transition hover:bg-surface-hover">
              Status: Active
            </button>
            <button className="text-primary text-sm font-medium hover:underline px-2">
              Add filter
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 rounded-md p-1 bg-surface shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <button className="p-1.5 bg-primary/10 text-primary rounded">
            <LayoutList size={16} />
          </button>
          <button className="p-1.5 text-text-muted hover:text-text-main rounded hover:bg-surface-hover">
            <Grid size={16} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none bg-surface transition-colors">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-hover border-b border-border/50">
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Project</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-40">Project Health</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-48">Automation</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-48">Test Runs</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-32">Team</th>
              <th className="px-6 py-4 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProjects.map((project, idx) => {
              const colors = ["bg-amber-600", "bg-emerald-700", "bg-indigo-600", "bg-blue-600", "bg-rose-600", "bg-purple-600"];
              const colorClass = colors[idx % colors.length];

              // Fake avatars array for Team column based on member count
              const avatars = Array.from({ length: Math.min(project.teamMembers, 3) }).map((_, i) => `bg-slate-${300 + (i * 100)}`);
              
              return (
                <tr key={project.id} className="hover:bg-surface-hover transition-colors group">
                  <td className="px-6 py-5 align-middle">
                    <Link href={`/projects/${project.code}/repository`} className="flex items-start space-x-4">
                      <div className={`w-11 h-11 ${colorClass} rounded-lg text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm`}>
                        {project.code.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-text-main text-[15px] group-hover:text-primary transition-colors">
                          {project.name}
                        </div>
                        <div className="text-xs text-text-muted mt-1.5 flex items-center space-x-2">
                          <span>{project.testCasesCount} cases</span>
                          <span className="text-border">•</span>
                          <span>{project.suitesCount} suites</span>
                          <span className="text-border">•</span>
                          <span>Updated {timeAgo(project.updatedAt)}</span>
                        </div>
                      </div>
                    </Link>
                  </td>
                  
                  {/* Project Health (Latest Run Pass Rate) */}
                  <td className="px-6 py-5 align-middle">
                    {project.latestRunPassRate !== null ? (
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${project.latestRunPassRate >= 90 ? 'bg-emerald-500' : project.latestRunPassRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                        <span className={`text-sm font-semibold ${project.latestRunPassRate >= 90 ? 'text-emerald-700' : project.latestRunPassRate >= 70 ? 'text-amber-700' : 'text-red-700'}`}>
                          {project.latestRunPassRate.toFixed(0)}% Pass
                        </span>
                      </div>
                    ) : (
                      <span className="text-text-muted text-sm">No data</span>
                    )}
                  </td>

                  {/* Automation Status */}
                  <td className="px-6 py-5 align-middle">
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-text-main">{project.automationPercent.toFixed(0)}% Automated</span>
                      </div>
                      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(93,135,255,0.4)]" 
                          style={{ width: `${project.automationPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Test Runs */}
                  <td className="px-6 py-5 align-middle">
                    <div className="flex flex-col space-y-1.5">
                      {project.testRunsCount > 0 ? (
                        <Link href={`/projects/${project.code}/runs`} className="text-primary text-xs font-medium hover:underline block">
                          {project.activeRunsCount} active / {project.testRunsCount} total runs
                        </Link>
                      ) : (
                        <span className="text-text-muted text-xs">No test runs</span>
                      )}
                    </div>
                  </td>

                  {/* Team Members */}
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center">
                      {project.teamMembers > 0 ? (
                        <div className="flex -space-x-2">
                          {avatars.map((_, i) => (
                            <div key={i} className={`w-8 h-8 rounded-full border-2 border-surface bg-surface-hover flex items-center justify-center text-[10px] font-bold text-text-muted z-${30-i} shadow-sm`}>
                              U{i+1}
                            </div>
                          ))}
                          {project.teamMembers > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-surface bg-background flex items-center justify-center text-[10px] font-bold text-text-muted z-0 shadow-sm">
                              +{project.teamMembers - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-muted text-sm">No members</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5 align-middle text-right">
                    <div className="relative inline-block text-left" ref={activeDropdown === project.id ? dropdownRef : null}>
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === project.id ? null : project.id)}
                        className={`p-1.5 rounded transition ${activeDropdown === project.id ? 'bg-surface-hover text-text-main' : 'text-text-muted hover:text-text-main hover:bg-surface-hover'}`}
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {activeDropdown === project.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-surface border-none rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] py-1 z-30 overflow-hidden">
                          <Link 
                            href={`/projects/${project.code}/dashboards`}
                            className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center"
                          >
                            <LayoutList size={14} className="mr-2 text-slate-400" /> View Dashboard
                          </Link>
                          <Link 
                            href={`/projects/${project.code}/settings/members`}
                            className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface-hover flex items-center"
                          >
                            <Settings size={14} className="mr-2 text-text-muted" /> Project Settings
                          </Link>
                          <div className="h-px bg-border my-1"></div>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-surface-hover flex items-center"
                            onClick={() => alert('Archive project coming soon')}
                          >
                            <Archive size={14} className="mr-2 text-amber-400" /> Archive Project
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredProjects.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="text-text-muted mb-2">No projects found.</div>
                  <Link href="?create=true" className="text-primary text-sm font-medium hover:underline">
                    Create a new project
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
