"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, DollarSign, TrendingUp, TrendingDown, Users, FileText, AlertTriangle, Clock, Building2, MessageSquare } from "lucide-react";
import Sidebar from "@/components/sidebar";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar user={user} />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Hardcoded plastic injection molding data
  const dashboardData = {
    dailyBrief: [
      { text: "AR >60d grew by $48k; ACME Plastics renewal at risk", type: "warning" },
      { text: "Mold #47 cycle time reduced 15% - efficiency gain $12k/mo", type: "success" },
      { text: "Q1 resin costs up 8% YoY - supplier negotiation needed", type: "warning" },
      { text: "New RFQ from Tesla - $2.3M opportunity in pipeline", type: "success" },
      { text: "ISO audit scheduled next week - 3 docs pending signature", type: "alert" }
    ],
    finance: {
      revenue: { current: 2847000, target: 2950000, change: -3.5 },
      cogs: { current: 1423500, percent: 50 },
      opex: { current: 854100, percent: 30 },
      ebitda: { current: 569400, margin: 20 },
      cashBalance: 847000,
      runway: 8.2,
      arAging: {
        current: { amount: 234000, count: 12 },
        "30": { amount: 156000, count: 8 },
        "60": { amount: 48000, count: 3 },
        "90": { amount: 30000, count: 1, customer: "ACME Plastics" }
      },
      topVendors: [
        { name: "DuPont Resin Supply", spend: 145000, change: 8.2 },
        { name: "Tooling Masters Inc", spend: 89000, change: -2.1 },
        { name: "Precision Mold Co", spend: 67000, change: 15.4 },
        { name: "Industrial Electric", spend: 34000, change: 3.2 }
      ]
    },
    sales: {
      pipeline: [
        { stage: "New", count: 8, value: 450000 },
        { stage: "Qualified", count: 5, value: 1200000 },
        { stage: "Proposal", count: 3, value: 2300000 },
        { stage: "Verbal", count: 2, value: 890000 },
        { stage: "Closed", count: 1, value: 450000 }
      ],
      forecast: { thisMonth: 450000, next90: 3240000 },
      atRisk: [
        { customer: "ACME Plastics", revenue: 180000, reason: "Price concerns", sentiment: "negative" },
        { customer: "AutoParts Inc", revenue: 95000, reason: "Quality issues", sentiment: "neutral" }
      ],
      topCustomers: [
        { name: "Tesla Manufacturing", revenue: 540000, margin: 22, outstanding: 0, lastTouch: "2 days ago" },
        { name: "Ford Tier 1", revenue: 380000, margin: 18, outstanding: 45000, lastTouch: "1 week ago" },
        { name: "Medical Devices Corp", revenue: 290000, margin: 25, outstanding: 0, lastTouch: "3 days ago" }
      ]
    },
    operations: {
      projects: [
        { name: "Tesla Model Y Dashboard", planned: 480, actual: 552, budget: 96000, spent: 110400 },
        { name: "Medical Housing Mold", planned: 240, actual: 228, budget: 48000, spent: 45600 },
        { name: "Automotive Connector", planned: 360, actual: 378, budget: 72000, spent: 75600 }
      ],
      sla: {
        dueToday: 5,
        overdue24h: 3,
        overdue7d: 1
      },
      throughput: [
        { week: "W1", completed: 12, created: 14 },
        { week: "W2", completed: 15, created: 13 },
        { week: "W3", completed: 13, created: 16 },
        { week: "W4", completed: 18, created: 15 }
      ],
      recentDocs: [
        { name: "ISO Audit Checklist 2025", type: "compliance", status: "pending" },
        { name: "Tesla SOW Amendment", type: "contract", status: "signed" },
        { name: "Mold #47 Efficiency Report", type: "report", status: "new" }
      ]
    },
    people: {
      utilization: [
        { team: "Production", rate: 92, trend: "up" },
        { team: "Quality Control", rate: 78, trend: "stable" },
        { team: "Engineering", rate: 85, trend: "down" },
        { team: "Sales", rate: 65, trend: "up" }
      ],
      absences: [
        { person: "Mike Johnson", dates: "Dec 20-27", impact: "Production lead - holiday coverage needed" },
        { person: "Sarah Chen", dates: "Dec 15-17", impact: "QC manager - audit prep affected" }
      ],
      hiring: [
        { role: "Mold Technician", stage: "Interviewing", daysOpen: 23 },
        { role: "Quality Engineer", stage: "Offer Extended", daysOpen: 45 }
      ]
    },
    governance: {
      recentChanges: [
        { action: "Connected QuickBooks", user: "admin", date: "2 days ago" },
        { action: "New user: kyle@unit.com", user: "admin", date: "1 week ago" }
      ],
      complianceIssues: [
        { issue: "3 purchase orders missing invoices", severity: "medium" },
        { issue: "Liability insurance expires in 45 days", severity: "high" },
        { issue: "2 NDAs pending signature", severity: "low" }
      ],
      anomalies: [
        { type: "Unusual spend", detail: "Resin costs up 23% this month", flag: "investigate" },
        { type: "Duplicate vendor", detail: "DuPont billed twice (AP error)", flag: "resolve" }
      ]
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />

      <div className="flex-1 overflow-auto">
        <div className="flex gap-6 p-8">
          {/* Daily Brief Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Daily Brief</h2>
              <p className="text-sm text-gray-500 mb-4">What changed since yesterday</p>
              
              <div className="space-y-3">
                {dashboardData.dailyBrief.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <div className={`flex-shrink-0 w-1.5 rounded-full ${
                      item.type === 'success' ? 'bg-green-500' :
                      item.type === 'warning' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`} />
                    <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="flex-1 space-y-6">
            {/* Row 1: Finance at a Glance */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Finance at a Glance
              </h2>
              <div className="grid grid-cols-4 gap-4">
                {/* Monthly P&L */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm text-gray-500 mb-1">Revenue</div>
                  <div className="text-2xl font-bold text-gray-900">${(dashboardData.finance.revenue.current / 1000).toFixed(0)}K</div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-600">{Math.abs(dashboardData.finance.revenue.change)}% vs target</span>
                  </div>
                </div>

                {/* Cash Runway */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm text-gray-500 mb-1">Cash Runway</div>
                  <div className="text-2xl font-bold text-gray-900">{dashboardData.finance.runway} mo</div>
                  <div className="text-xs text-gray-600 mt-1">${(dashboardData.finance.cashBalance / 1000).toFixed(0)}K balance</div>
                </div>

                {/* A/R Aging */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm text-gray-500 mb-1">{"A/R > 60 Days"}</div>
                  <div className="text-2xl font-bold text-gray-900">${(dashboardData.finance.arAging["60"].amount / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-orange-600 mt-1">{dashboardData.finance.arAging["90"].customer}</div>
                </div>

                {/* EBITDA */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm text-gray-500 mb-1">EBITDA Margin</div>
                  <div className="text-2xl font-bold text-gray-900">{dashboardData.finance.ebitda.margin}%</div>
                  <div className="text-xs text-gray-600 mt-1">${(dashboardData.finance.ebitda.current / 1000).toFixed(0)}K this month</div>
                </div>
              </div>

              {/* Top Vendors */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Top Vendors (MoM Change)</div>
                <div className="space-y-2">
                  {dashboardData.finance.topVendors.map((vendor, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-900">{vendor.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">${(vendor.spend / 1000).toFixed(0)}K</span>
                        <div className={`flex items-center gap-1 ${vendor.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {vendor.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <span className="text-xs font-medium">{Math.abs(vendor.change)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>

            {/* Row 2: Sales & Customers */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Sales & Customers
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {/* Pipeline */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm font-medium text-gray-700 mb-3">Pipeline by Stage</div>
                  <div className="space-y-2">
                    {dashboardData.sales.pipeline.map((stage, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm text-gray-700">{stage.stage}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">${(stage.value / 1000).toFixed(0)}K</span>
                          <span className="text-gray-500 ml-2">({stage.count})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500">Forecast Next 90 Days</div>
                    <div className="text-xl font-bold text-gray-900">${(dashboardData.sales.forecast.next90 / 1000000).toFixed(1)}M</div>
                  </div>
                </div>

                {/* At Risk + Top Customers */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="text-sm font-medium text-gray-700 mb-3">Accounts at Risk</div>
                    {dashboardData.sales.atRisk.map((account, i) => (
                      <div key={i} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{account.customer}</span>
                          <span className="text-xs font-medium text-red-600">${(account.revenue / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="text-xs text-gray-600">{account.reason}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="text-sm font-medium text-gray-700 mb-3">Top Customers</div>
                    {dashboardData.sales.topCustomers.slice(0, 2).map((customer, i) => (
                      <div key={i} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                          <span className="text-xs font-medium text-green-600">{customer.margin}% margin</span>
                        </div>
                        <div className="text-xs text-gray-600">${(customer.revenue / 1000).toFixed(0)}K • {customer.lastTouch}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Operations */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                Operations & Production
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {/* Project Burn-down */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm font-medium text-gray-700 mb-3">Project Health</div>
                  {dashboardData.operations.projects.map((project, i) => (
                    <div key={i} className="mb-3 last:mb-0">
                      <div className="text-sm font-medium text-gray-900 mb-1">{project.name}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{project.actual}h / {project.planned}h</span>
                        <span className={project.spent > project.budget ? 'text-red-600' : 'text-green-600'}>
                          {((project.spent / project.budget - 1) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SLA Heatmap */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm font-medium text-gray-700 mb-3">SLA Status</div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">Due Today</span>
                        <span className="text-lg font-bold text-orange-600">{dashboardData.operations.sla.dueToday}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{"Overdue > 24h"}</span>
                        <span className="text-lg font-bold text-red-600">{dashboardData.operations.sla.overdue24h}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{"Critical > 7d"}</span>
                        <span className="text-lg font-bold text-red-700">{dashboardData.operations.sla.overdue7d}</span>
                      </div>
                    </div>
                  </div>
                    </div>

                {/* Recent Critical Docs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm font-medium text-gray-700 mb-3">Recent Critical Documents</div>
                  <div className="space-y-2">
                    {dashboardData.operations.recentDocs.map((doc, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm text-gray-900">{doc.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{doc.type}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              doc.status === 'signed' ? 'bg-green-100 text-green-700' :
                              doc.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {doc.status}
                              </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: People */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                People & Capacity
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {/* Utilization */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm font-medium text-gray-700 mb-3">Team Utilization</div>
                  {dashboardData.people.utilization.map((team, i) => (
                    <div key={i} className="mb-3 last:mb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{team.team}</span>
                        <span className={`text-sm font-bold ${
                          team.rate > 90 ? 'text-red-600' :
                          team.rate > 80 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>{team.rate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            team.rate > 90 ? 'bg-red-500' :
                            team.rate > 80 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${team.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upcoming PTO */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm font-medium text-gray-700 mb-3">Upcoming Absences</div>
                  {dashboardData.people.absences.map((absence, i) => (
                    <div key={i} className="mb-3 last:mb-0">
                      <div className="text-sm font-medium text-gray-900">{absence.person}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{absence.dates}</div>
                      <div className="text-xs text-orange-600 mt-1">{absence.impact}</div>
                          </div>
                        ))}
                </div>

                {/* Hiring */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm font-medium text-gray-700 mb-3">Open Positions</div>
                  {dashboardData.people.hiring.map((role, i) => (
                    <div key={i} className="mb-3 last:mb-0">
                      <div className="text-sm font-medium text-gray-900">{role.role}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-600">{role.stage}</span>
                        <span className="text-xs text-gray-500">{role.daysOpen} days</span>
                      </div>
                  </div>
                ))}
                </div>
              </div>
            </div>

            {/* Row 5: Governance & Risk */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Governance & Risk
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {/* Compliance Issues */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm font-medium text-gray-700 mb-3">Compliance Alerts</div>
                  {dashboardData.governance.complianceIssues.map((issue, i) => (
                    <div key={i} className="mb-2 last:mb-0">
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1 ${
                          issue.severity === 'high' ? 'bg-red-500' :
                          issue.severity === 'medium' ? 'bg-orange-500' :
                          'bg-yellow-500'
                        }`} />
                        <span className="text-sm text-gray-700">{issue.issue}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Anomalies */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm font-medium text-gray-700 mb-3">Anomalies Detected</div>
                  {dashboardData.governance.anomalies.map((anomaly, i) => (
                    <div key={i} className="mb-3 last:mb-0">
                      <div className="text-sm font-medium text-gray-900">{anomaly.type}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{anomaly.detail}</div>
                      <div className="text-xs text-blue-600 mt-1">→ {anomaly.flag}</div>
                    </div>
                  ))}
                </div>

                {/* Recent Changes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="text-sm font-medium text-gray-700 mb-3">Audit Trail</div>
                  {dashboardData.governance.recentChanges.map((change, i) => (
                    <div key={i} className="mb-2 last:mb-0">
                      <div className="text-sm text-gray-900">{change.action}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{change.date}</div>
                    </div>
                  ))}
                  </div>
              </div>
              </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Need answers about your business?</h3>
                  <p className="text-sm text-gray-600">Ask AI anything about your operations, finances, or customers</p>
                </div>
                <button
                  onClick={() => router.push('/chat')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  Open AI Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
