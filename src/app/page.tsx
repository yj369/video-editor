"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Video, Clock } from "lucide-react";
import { MOCK_PROJECTS } from "../data/mock";

export default function DashboardPage() {
  const router = useRouter();
  const [projects] = useState(MOCK_PROJECTS);
  const formatDate = (value: number) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  return (
    <div className="min-h-screen bg-[#0b0e12] text-[#e9eef5] p-8">
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">我的项目</h1>
          <p className="text-white/40 mt-1">管理并编辑您的视频工程</p>
        </div>
        <button 
          onClick={() => {
            // In a real app, this would create a new project ID
            router.push(`/editor/new-${Date.now()}`);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-medium transition"
        >
          <Plus size={18} />
          新建项目
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => router.push(`/editor/${project.id}`)}
            className="group relative bg-[#1c212b] border border-white/5 hover:border-blue-500/50 rounded-2xl p-4 text-left transition-all hover:-translate-y-1"
          >
            <div className="aspect-video bg-black/40 rounded-xl mb-4 flex items-center justify-center group-hover:bg-black/60 transition">
              <Video className="text-white/20 group-hover:text-blue-400 transition" size={48} />
            </div>
            <h3 className="text-lg font-semibold truncate pr-4">{project.name}</h3>
            <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDate(project.lastModified)}
              </span>
              <span>{project.duration}s</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
