"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SchemaData {
  entities: string[];
  relationships: string[];
  entity_counts: { [key: string]: number };
  overrides: any[];
}

export default function AdminSchemaPage() {
  const router = useRouter();
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [showAddRelation, setShowAddRelation] = useState(false);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/schema`,
        { headers: { "X-Admin-Session": token } }
      );

      if (res.ok) {
        setSchema(await res.json());
      }
    } catch (error) {
      console.error("Error fetching schema:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading schema...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Knowledge Graph Schema
        </h1>
        <p className="text-gray-400 mt-2">
          Manage entities and relationships for knowledge extraction
        </p>
      </div>

      {/* Warning Box */}
      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-yellow-400 mb-2">
          ⚠️ Schema Changes Require Restart
        </h3>
        <p className="text-gray-300 text-sm">
          Adding or removing entities/relationships requires an application restart
          to take effect. Existing documents will need to be re-processed to extract
          new entity types.
        </p>
      </div>

      {/* Entities */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Entity Types ({schema?.entities.length || 0})
          </h2>
          <button
            onClick={() => setShowAddEntity(!showAddEntity)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
          >
            + Add Entity
          </button>
        </div>

        {showAddEntity && (
          <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <h3 className="text-white font-medium mb-4">Add New Entity Type</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Entity Type (e.g., PROJECT)"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Description"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                  Create Entity
                </button>
                <button
                  onClick={() => setShowAddEntity(false)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schema?.entities.map((entity) => (
            <div
              key={entity}
              className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{entity}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {schema.entity_counts[entity]?.toLocaleString() || 0} nodes
                  </p>
                </div>
                <span className="text-2xl">
                  {entity === "PERSON"
                    ? "👤"
                    : entity === "COMPANY"
                    ? "🏢"
                    : entity === "MATERIAL"
                    ? "🔩"
                    : "📦"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Relationships */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Relationship Types ({schema?.relationships.length || 0})
          </h2>
          <button
            onClick={() => setShowAddRelation(!showAddRelation)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
          >
            + Add Relationship
          </button>
        </div>

        {showAddRelation && (
          <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <h3 className="text-white font-medium mb-4">
              Add New Relationship Type
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Relationship Type (e.g., MANAGES)"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="From Entity (e.g., PERSON)"
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
                <input
                  type="text"
                  placeholder="To Entity (e.g., PROJECT)"
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Description"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                  Create Relationship
                </button>
                <button
                  onClick={() => setShowAddRelation(false)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {schema?.relationships.map((rel) => (
            <div
              key={rel}
              className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center justify-between"
            >
              <span className="text-white font-mono text-sm">{rel}</span>
              <span className="text-gray-400 text-xs">Default</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Overrides */}
      {schema?.overrides && schema.overrides.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Custom Schema Overrides
          </h2>
          <div className="space-y-2">
            {schema.overrides.map((override) => (
              <div
                key={override.id}
                className="p-3 bg-purple-500/20 rounded-lg border border-purple-500/30 flex items-center justify-between"
              >
                <div>
                  <span className="text-white font-mono text-sm">
                    {override.entity_type || override.relation_type}
                  </span>
                  {override.description && (
                    <p className="text-gray-400 text-xs mt-1">
                      {override.description}
                    </p>
                  )}
                </div>
                <button className="text-sm text-red-400 hover:text-red-300">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
