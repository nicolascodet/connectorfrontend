"use client";

import { useEffect, useState } from "react";
import { getTrendingEntities } from "@/lib/api";
import { Users, Building2, Loader2, TrendingUp, Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface Entity {
  name: string;
  type: string;
  mentions: number;
  trend?: number;
}

export default function TrendingEntities() {
  const router = useRouter();
  const [people, setPeople] = useState<Entity[]>([]);
  const [companies, setCompanies] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getTrendingEntities(30, 10);
      setPeople(result.people || []);
      setCompanies(result.companies || []);
    } catch (err) {
      console.error("Failed to load trending entities:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleEntityClick = (entityName: string) => {
    router.push(`/search?q=${encodeURIComponent(entityName)}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Trending People & Companies</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Trending People & Companies</h3>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* People Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-gray-700">Top People</h4>
          </div>
          {people.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2">
              {people.slice(0, 5).map((person, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEntityClick(person.name)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-medium">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">{person.name}</p>
                      <p className="text-xs text-gray-500">{person.mentions} mentions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {person.trend && person.trend > 0 && (
                      <div className="flex items-center gap-0.5 text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs font-medium">+{person.trend}%</span>
                      </div>
                    )}
                    <Search className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Companies Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-green-600" />
            <h4 className="text-sm font-semibold text-gray-700">Top Companies</h4>
          </div>
          {companies.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2">
              {companies.slice(0, 5).map((company, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEntityClick(company.name)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">{company.name}</p>
                      <p className="text-xs text-gray-500">{company.mentions} mentions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {company.trend && company.trend > 0 && (
                      <div className="flex items-center gap-0.5 text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs font-medium">+{company.trend}%</span>
                      </div>
                    )}
                    <Search className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Most mentioned in the last 30 days • Click to search
        </p>
      </div>
    </div>
  );
}
