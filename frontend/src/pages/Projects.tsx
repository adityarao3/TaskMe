import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface Project { id: string; name: string; description: string | null; owner_id: string; created_at: string; my_role: string; member_count: string; task_count: string; }

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]); const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false); const [creating, setCreating] = useState(false);
  const [name, setName] = useState(''); const [description, setDescription] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'member'>('all');

  useEffect(() => { loadProjects(); }, []);
  async function loadProjects() { try { const { data } = await api.get('/api/projects'); setProjects(data); } finally { setLoading(false); } }
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim()) return; setCreating(true);
    try { await api.post('/api/projects', { name, description }); setDialogOpen(false); setName(''); setDescription(''); await loadProjects(); } finally { setCreating(false); }
  }
  const filtered = projects.filter(p => filter === 'admin' ? p.my_role === 'admin' : filter === 'member' ? p.my_role === 'member' : true);

  if (loading) return <div className="p-8 w-full"><div className="animate-pulse space-y-6"><div className="h-10 w-60 clay-card" /><div className="grid grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-48 clay-card" />)}</div></div></div>;

  return (
    <div className="w-full flex-1 bg-background">
      <div className="p-8 pb-0">
        <div className="flex items-end justify-between mb-2">
          <div>
            <h1 className="text-[40px] font-bold tracking-tight text-foreground leading-[1.2]">Projects</h1>
            <p className="text-base text-muted-foreground mt-1">Manage your workspaces</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="clay-btn px-6 py-3 font-semibold text-[15px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span>Create
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md clay-card border-0 !rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">Create Project</DialogTitle>
                <DialogDescription>Add a new project to organize your team's work.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-4">Project Name</Label>
                  <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Mobile App Redesign" className="clay-input w-full py-3.5 px-5 text-sm text-foreground font-medium" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-4">Description</Label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What is this project about?" className="clay-input-rect w-full px-5 py-3.5 text-sm text-foreground font-medium resize-none !rounded-2xl" /></div>
                <DialogFooter>
                  <button type="button" onClick={() => setDialogOpen(false)} className="clay-btn-ghost px-5 py-2.5 text-sm font-semibold text-muted-foreground">Cancel</button>
                  <button type="submit" disabled={creating} className="clay-btn px-6 py-2.5 text-sm font-semibold flex items-center gap-2">
                    {creating ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : 'Create'}</button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-6 mb-6">
          <div className="flex bg-accent rounded-full p-1 clay-pressed">
            {[{ key: 'all', label: 'All' }, { key: 'admin', label: 'Owned' }, { key: 'member', label: 'Member' }].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key as typeof filter)}
                className={`px-5 py-2 rounded-full text-xs font-bold tracking-wider clay-transition ${filter === f.key ? 'bg-popover text-foreground shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.8)]' : 'text-muted-foreground hover:text-foreground'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-muted-foreground font-semibold self-center">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="px-8 pb-8">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(project => (
              <Link key={project.id} to={`/projects/${project.id}`} className="group">
                <article className="clay-card p-6 flex flex-col gap-4 h-full clay-transition hover:translate-y-[-4px]">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-2xl clay-pressed !rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined fill text-primary text-[20px]">folder</span>
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${project.my_role === 'admin' ? 'text-secondary-foreground bg-secondary' : 'text-muted-foreground bg-muted'}`}>{project.my_role === 'admin' ? 'Owner' : 'Member'}</span>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-foreground mb-1">{project.name}</h3>
                    {project.description && <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>}
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-muted-foreground">group</span><span className="text-xs font-semibold text-muted-foreground">{project.member_count}</span></div>
                    <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-muted-foreground">task</span><span className="text-xs font-semibold text-muted-foreground">{project.task_count}</span></div>
                    <span className="ml-auto text-[11px] text-muted-foreground">{new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="clay-card p-16 text-center">
            <div className="clay-pressed !rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4"><span className="material-symbols-outlined fill text-primary text-3xl">folder</span></div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">No Projects Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">Create your first project to get started.</p>
            <button onClick={() => setDialogOpen(true)} className="clay-btn px-6 py-3 font-semibold text-[15px] flex items-center gap-2 mx-auto"><span className="material-symbols-outlined text-[18px]">add</span>Create First Project</button>
          </div>
        )}
      </div>
    </div>
  );
}
