"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CompanySettings {
  id: number;
  company_name: string;
  company_location: string;
  company_description: string;
  industries_served: string[];
  key_capabilities: string[];
}

interface TeamMember {
  id: number;
  name: string;
  title: string;
  role_description: string;
  reports_to: string;
}

export default function AdminCompanyPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      // Fetch company settings
      const settingsRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/company/settings`,
        { headers: { "X-Admin-Session": token } }
      );
      if (settingsRes.ok) {
        setSettings(await settingsRes.json());
      }

      // Fetch team
      const teamRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/company/team`,
        { headers: { "X-Admin-Session": token } }
      );
      if (teamRes.ok) {
        const data = await teamRes.json();
        setTeam(data.team || []);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading company settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Company Settings</h1>
        <p className="text-gray-400 mt-2">
          Manage company profile and team structure
        </p>
      </div>

      {/* Company Profile */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Company Profile</h2>
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {settings && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Company Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={settings.company_name}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  onChange={(e) =>
                    setSettings({ ...settings, company_name: e.target.value })
                  }
                />
              ) : (
                <p className="text-white">{settings.company_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Location
              </label>
              {editing ? (
                <input
                  type="text"
                  value={settings.company_location}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company_location: e.target.value,
                    })
                  }
                />
              ) : (
                <p className="text-white">{settings.company_location}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Description
              </label>
              {editing ? (
                <textarea
                  value={settings.company_description}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company_description: e.target.value,
                    })
                  }
                />
              ) : (
                <p className="text-white">{settings.company_description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Industries Served
              </label>
              <div className="flex flex-wrap gap-2">
                {settings.industries_served.map((industry, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Key Capabilities
              </label>
              <ul className="list-disc list-inside space-y-1">
                {settings.key_capabilities.map((capability, i) => (
                  <li key={i} className="text-white text-sm">
                    {capability}
                  </li>
                ))}
              </ul>
            </div>

            {editing && (
              <div className="pt-4 border-t border-slate-700">
                <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
                  Save Changes
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Team Members */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Team Structure</h2>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
            + Add Member
          </button>
        </div>

        <div className="space-y-4">
          {team.map((member) => (
            <div
              key={member.id}
              className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {member.name}
                  </h3>
                  <p className="text-blue-400 text-sm">{member.title}</p>
                  {member.role_description && (
                    <p className="text-gray-400 text-sm mt-2">
                      {member.role_description}
                    </p>
                  )}
                  {member.reports_to && (
                    <p className="text-gray-500 text-xs mt-2">
                      Reports to: {member.reports_to}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="text-sm text-blue-400 hover:text-blue-300">
                    Edit
                  </button>
                  <button className="text-sm text-red-400 hover:text-red-300">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          💡 About Company Settings
        </h3>
        <p className="text-gray-300 text-sm">
          These settings are used throughout the system to generate contextual prompts
          for spam detection, entity extraction, and AI responses. Updating these
          settings will improve the accuracy of the system for your specific business.
        </p>
      </div>
    </div>
  );
}
