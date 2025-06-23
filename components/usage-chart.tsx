"use client";

import { useEffect, useState } from "react";
import { scaleLinear } from "d3-scale";

interface ChartData {
  source_doc_id: string;
  usage_count: number;
  journal: string;
  link: string;
}

export function UsageChart({ sessionUsage }: { sessionUsage: ChartData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const sortedData = sessionUsage
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 10); // Show top 10

  const maxUsage = Math.max(...sortedData.map((d) => d.usage_count), 1);
  const scale = scaleLinear().domain([0, maxUsage]).range([0, 200]);

  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-zinc-800 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-700">
      <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
        Most Cited Articles (This Session)
      </h3>
      
      {sortedData.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          No citations yet. Start asking questions to see cited articles here.
        </p>
      ) : (
        <div className="space-y-3">
          {sortedData.map((item, index) => (
            <div key={item.source_doc_id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {index + 1}.
                  </span>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                    title={item.source_doc_id}
                  >
                    {item.source_doc_id}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scale(item.usage_count)}px` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
                    {item.usage_count} cite{item.usage_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 