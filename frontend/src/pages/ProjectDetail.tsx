import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api/axios';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import TaskEditModal from '../components/TaskEditModal';

interface Member { id: string; name: string; email: string; role: string; joined_at: string; }
interface Project { id: string; name: string; description: string | null; owner_id: string; my_role: string; members: Member[]; }
interface Task { id: string; project_id: string; title: string; description: string | null; status: string; priority: string; assigned_to: string | null; assigned_to_name: string | null; created_by: string; created_by_name: string | null; due_date: string | null; created_at: string; subtask_count?: string; subtask_done?: string; comment_count?: string; }
interface Activity { id: string; action: string; details: string; user_name: string; created_at: string; }

const STATUS_COLUMNS = ['todo', 'in_progress', 'done'] as const;
const STATUS_LABELS: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_ICONS: Record<string, string> = { todo: 'radio_button_unchecked', in_progress: 'pending', done: 'check_circle' };

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>(); const { user } = useAuth(); const { toast } = useToast(); const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null); const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true); const [showAddTask, setShowAddTask] = useState(false);
  const [showInvite, setShowInvite] = useState(false); const [editTask, setEditTask] = useState<Task | null>(null);
  const [search, setSearch] = useState(''); const [filterPriority, setFilterPriority] = useState('');
  const [showActivity, setShowActivity] = useState(false); const [activities, setActivities] = useState<Activity[]>([]);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null); const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  async function load() { try { const [p, t] = await Promise.all([api.get(`/api/projects/${id}`), api.get(`/api/tasks?project_id=${id}`)]); setProject(p.data); setTasks(t.data); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [id]);
  const isAdmin = project?.my_role === 'admin';

  async function changeStatus(taskId: string, newStatus: string) {
    try { await api.patch(`/api/tasks/${taskId}/status`, { status: newStatus }); setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)); toast('Status updated', 'success'); }
    catch { toast('Failed to update', 'error'); }
  }
  async function deleteProject() { if (!window.confirm(`Delete "${project?.name}"? This cannot be undone.`)) return; try { await api.delete(`/api/projects/${id}`); toast('Project deleted', 'success'); navigate('/projects'); } catch { toast('Failed', 'error'); } }
  async function exportCSV() { try { const r = await api.get(`/api/projects/${id}/export`, { responseType: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([r.data])); a.download = `${project?.name}_export.csv`; a.click(); toast('Exported', 'success'); } catch { toast('Failed', 'error'); } }
  async function loadActivity() { try { const { data } = await api.get(`/api/activity?project_id=${id}`); setActivities(data); setShowActivity(true); } catch { toast('Failed', 'error'); } }

  function onDragStart(e: React.DragEvent, taskId: string) { setDragTaskId(taskId); e.dataTransfer.effectAllowed = 'move'; }
  function onDragOver(e: React.DragEvent, col: string) { e.preventDefault(); setDragOverCol(col); }
  function onDragLeave() { setDragOverCol(null); }
  function onDrop(e: React.DragEvent, targetStatus: string) { e.preventDefault(); if (dragTaskId) { const t = tasks.find(x => x.id === dragTaskId); if (t && t.status !== targetStatus) changeStatus(dragTaskId, targetStatus); } setDragTaskId(null); setDragOverCol(null); }

  const filtered = tasks.filter(t => { if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false; if (filterPriority && t.priority !== filterPriority) return false; return true; });

  if (loading) return <div className="p-8 animate-pulse"><div className="h-12 w-64 clay-card mb-4" /><div className="h-[500px] clay-card" /></div>;
  if (!project) return null;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <Link to="/projects" className="text-xs font-bold text-muted-foreground hover:text-primary clay-transition inline-flex items-center gap-1 mb-1 tracking-wider uppercase">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>Projects
          </Link>
          <h2 className="text-[32px] font-semibold tracking-tight text-foreground leading-[1.3]">{project.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1 mr-2">
            {project.members.slice(0, 4).map(m => (
              <div key={m.id} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground ring-2 ring-background" title={m.name}>
                {m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            ))}
          </div>
          <button onClick={loadActivity} className="clay-btn-ghost w-9 h-9 flex items-center justify-center" title="Activity"><span className="material-symbols-outlined text-[18px] text-muted-foreground">history</span></button>
          <button onClick={exportCSV} className="clay-btn-ghost w-9 h-9 flex items-center justify-center" title="Export"><span className="material-symbols-outlined text-[18px] text-muted-foreground">download</span></button>
          {isAdmin && (<>
            <button onClick={() => setShowInvite(true)} className="clay-btn-ghost px-4 py-2 text-xs font-bold text-muted-foreground tracking-wider">Invite</button>
            <button onClick={() => setShowAddTask(true)} className="clay-btn px-4 py-2 text-xs font-bold flex items-center gap-1 tracking-wider"><span className="material-symbols-outlined text-[16px]">add</span>Task</button>
            <button onClick={deleteProject} className="clay-btn-ghost w-9 h-9 flex items-center justify-center" title="Delete"><span className="material-symbols-outlined text-[18px] text-destructive">delete</span></button>
          </>)}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-8 pb-4 flex items-center gap-3 shrink-0">
        <div className="clay-input flex items-center gap-2 px-4 py-2.5 flex-1 max-w-xs">
          <span className="material-symbols-outlined text-[18px] text-muted-foreground">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="bg-transparent border-none text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none w-full font-medium" />
        </div>
        <div className="flex p-1 clay-pressed">
          {['high', 'medium', 'low'].map(p => (
            <button key={p} onClick={() => setFilterPriority(filterPriority === p ? '' : p)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider capitalize clay-transition ${filterPriority === p ? 'bg-popover text-primary shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.8)]' : 'text-muted-foreground'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 grid grid-cols-3 gap-5 px-8 pb-6 overflow-hidden">
        {STATUS_COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.status === col);
          return (
            <div key={col} className={`flex flex-col h-full rounded-2xl clay-transition ${dragOverCol === col ? 'clay-pressed !rounded-2xl' : 'clay-card'}`}
              onDragOver={e => onDragOver(e, col)} onDragLeave={onDragLeave} onDrop={e => onDrop(e, col)}>
              <div className="p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined fill text-[20px] ${col === 'done' ? 'text-primary' : col === 'in_progress' ? 'text-secondary-foreground' : 'text-muted-foreground'}`}>{STATUS_ICONS[col]}</span>
                  <h3 className="text-[15px] font-bold text-foreground">{STATUS_LABELS[col]}</h3>
                </div>
                <span className="text-xs font-bold text-muted-foreground clay-pressed w-7 h-7 flex items-center justify-center rounded-full">{colTasks.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
                {colTasks.map(task => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                  const daysLeft = task.due_date ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000) : null;
                  return (
                    <article key={task.id} draggable onDragStart={e => onDragStart(e, task.id)}
                      className={`clay-card-sm p-4 cursor-pointer clay-transition hover:translate-y-[-3px] ${dragTaskId === task.id ? 'opacity-40 scale-95' : ''} ${col === 'done' ? 'opacity-60' : ''}`}
                      onClick={() => setEditTask(task)}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`text-sm font-semibold text-foreground pr-2 ${col === 'done' ? 'line-through' : ''}`}>{task.title}</h4>
                        {task.priority === 'high' && col !== 'done' && <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full shrink-0">HIGH</span>}
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {task.assigned_to_name ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold text-secondary-foreground">{task.assigned_to_name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</div>
                              <span className="text-[10px] text-muted-foreground">{task.assigned_to_name.split(' ')[0]}</span>
                            </div>
                          ) : <span className="text-[10px] text-muted-foreground/50">Unassigned</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {Number(task.comment_count) > 0 && <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">chat</span>{task.comment_count}</span>}
                          {Number(task.subtask_count) > 0 && <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">check_box</span>{task.subtask_done}/{task.subtask_count}</span>}
                          {isOverdue && <span className="text-destructive font-bold animate-pulse">LATE</span>}
                          {daysLeft !== null && daysLeft > 0 && daysLeft <= 3 && col !== 'done' && <span className="text-amber-600 font-bold">{daysLeft}d</span>}
                          {task.due_date && !isOverdue && (daysLeft === null || daysLeft > 3) && <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        </div>
                      </div>
                    </article>
                  );
                })}
                {colTasks.length === 0 && <div className="clay-pressed !rounded-2xl p-6 text-center text-xs text-muted-foreground">Drop tasks here</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {editTask && <TaskEditModal task={editTask} members={project.members} isAdmin={isAdmin} userId={user?.id || ''}
        onClose={() => setEditTask(null)} onUpdated={t => { setTasks(prev => prev.map(x => x.id === t.id ? { ...x, ...t } : x)); setEditTask(null); toast('Updated', 'success'); }}
        onDeleted={tid => { setTasks(prev => prev.filter(x => x.id !== tid)); setEditTask(null); toast('Deleted', 'success'); }} />}

      {showAddTask && <AddTaskModal projectId={id!} members={project.members} onClose={() => setShowAddTask(false)}
        onCreated={t => { setTasks(prev => [...prev, t]); setShowAddTask(false); toast('Created', 'success'); }} />}

      {showInvite && <InviteModal projectId={id!} onClose={() => setShowInvite(false)} onInvited={() => { setShowInvite(false); load(); toast('Invited', 'success'); }} />}

      {showActivity && (
        <Dialog open onOpenChange={() => setShowActivity(false)}>
          <DialogContent className="sm:max-w-lg clay-card border-0 !rounded-2xl max-h-[80vh] flex flex-col">
            <DialogHeader><DialogTitle className="text-2xl font-semibold">Activity Log</DialogTitle></DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {activities.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm">No activity yet</p>}
              {activities.map(a => (
                <div key={a.id} className="clay-card-sm p-3 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[16px] text-primary mt-0.5">{a.action.includes('created') ? 'add_circle' : a.action.includes('deleted') ? 'remove_circle' : a.action.includes('status') ? 'swap_horiz' : 'edit'}</span>
                  <div><p className="text-sm text-foreground"><span className="font-bold">{a.user_name}</span> {a.details}</p><p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p></div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AddTaskModal({ projectId, members, onClose, onCreated }: { projectId: string; members: Member[]; onClose: () => void; onCreated: (t: Task) => void }) {
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState(''); const [due, setDue] = useState(''); const [creating, setCreating] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); if (!title.trim()) return; setCreating(true);
    try { const { data } = await api.post('/api/tasks', { project_id: projectId, title, description: desc || undefined, priority, assigned_to: assignee || undefined, due_date: due || undefined }); onCreated(data); } catch {} finally { setCreating(false); } }
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg clay-card border-0 !rounded-2xl">
        <DialogHeader><DialogTitle className="text-2xl font-semibold">Create Task</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required className="clay-input w-full py-3.5 px-5 text-sm font-medium text-foreground" /></div>
          <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="clay-input-rect w-full px-5 py-3.5 text-sm font-medium text-foreground resize-none !rounded-2xl" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="clay-input w-full py-3.5 px-4 text-sm font-medium text-foreground"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Assign</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)} className="clay-input w-full py-3.5 px-4 text-sm font-medium text-foreground"><option value="">—</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Due</label>
              <input type="date" value={due} onChange={e => setDue(e.target.value)} className="clay-input w-full py-3.5 px-4 text-sm font-medium text-foreground" /></div>
          </div>
          <DialogFooter>
            <button type="button" onClick={onClose} className="clay-btn-ghost px-5 py-2.5 text-sm font-semibold text-muted-foreground">Cancel</button>
            <button type="submit" disabled={creating} className="clay-btn px-6 py-2.5 text-sm font-semibold flex items-center gap-2">{creating ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : 'Create'}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InviteModal({ projectId, onClose, onInvited }: { projectId: string; onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState(''); const [role, setRole] = useState('member'); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function submit(e: React.FormEvent) { e.preventDefault(); if (!email.trim()) return; setError(''); setLoading(true);
    try { await api.post(`/api/projects/${projectId}/members`, { email, role }); onInvited(); } catch (err: any) { setError(err.response?.data?.error || 'Failed'); } finally { setLoading(false); } }
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md clay-card border-0 !rounded-2xl">
        <DialogHeader><DialogTitle className="text-2xl font-semibold">Invite Member</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          {error && <div className="clay-pressed !rounded-2xl px-5 py-3 flex items-center gap-2"><span className="material-symbols-outlined text-destructive text-[18px]">error</span><span className="text-sm font-semibold text-destructive">{error}</span></div>}
          <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="clay-input w-full py-3.5 px-5 text-sm font-medium text-foreground" /></div>
          <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="clay-input w-full py-3.5 px-5 text-sm font-medium text-foreground"><option value="member">Member</option><option value="admin">Admin</option></select></div>
          <DialogFooter>
            <button type="button" onClick={onClose} className="clay-btn-ghost px-5 py-2.5 text-sm font-semibold text-muted-foreground">Cancel</button>
            <button type="submit" disabled={loading} className="clay-btn px-6 py-2.5 text-sm font-semibold flex items-center gap-2">{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Inviting…</> : 'Invite'}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
