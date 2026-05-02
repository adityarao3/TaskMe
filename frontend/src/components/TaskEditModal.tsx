import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface Member { id: string; name: string; email: string; role: string; }
interface Task { id: string; project_id: string; title: string; description: string | null; status: string; priority: string; assigned_to: string | null; assigned_to_name: string | null; due_date: string | null; [key: string]: any; }
interface Comment { id: string; content: string; user_name: string; created_at: string; user_id: string; }
interface Subtask { id: string; title: string; completed: boolean; }

export default function TaskEditModal({ task, members, onClose, onUpdated, onDeleted, isAdmin, userId }: {
  task: Task; members: Member[]; onClose: () => void; onUpdated: (t: Task) => void; onDeleted: (id: string) => void; isAdmin: boolean; userId: string;
}) {
  const [title, setTitle] = useState(task.title); const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority); const [status, setStatus] = useState(task.status);
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || ''); const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '');
  const [saving, setSaving] = useState(false); const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState(''); const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState(''); const [tab, setTab] = useState<'details' | 'comments' | 'subtasks'>('details');

  useEffect(() => {
    api.get(`/api/comments?task_id=${task.id}`).then(r => setComments(r.data)).catch(() => {});
    api.get(`/api/subtasks?task_id=${task.id}`).then(r => setSubtasks(r.data)).catch(() => {});
  }, [task.id]);

  const canEdit = isAdmin || task.assigned_to === userId;

  async function handleSave() {
    setSaving(true);
    try {
      const { data } = await api.put(`/api/tasks/${task.id}`, { title, description: description || undefined, priority, status, assigned_to: assignedTo || undefined, due_date: dueDate || undefined });
      data.subtask_count = String(subtasks.length); data.subtask_done = String(subtasks.filter(s => s.completed).length); data.comment_count = String(comments.length);
      if (data.assigned_to) { const m = members.find(m => m.id === data.assigned_to); data.assigned_to_name = m?.name || task.assigned_to_name; }
      onUpdated(data);
    } catch { } finally { setSaving(false); }
  }

  async function handleDelete() { if (!window.confirm('Delete this task permanently?')) return; try { await api.delete(`/api/tasks/${task.id}`); onDeleted(task.id); } catch { } }
  async function addComment() { if (!newComment.trim()) return; try { const { data } = await api.post('/api/comments', { task_id: task.id, content: newComment }); setComments(prev => [...prev, data]); setNewComment(''); } catch { } }
  async function addSubtask() { if (!newSubtask.trim()) return; try { const { data } = await api.post('/api/subtasks', { task_id: task.id, title: newSubtask }); setSubtasks(prev => [...prev, data]); setNewSubtask(''); } catch { } }
  async function toggleSubtask(id: string) { try { const { data } = await api.patch(`/api/subtasks/${id}`); setSubtasks(prev => prev.map(s => s.id === id ? data : s)); } catch { } }
  async function deleteSubtask(id: string) { try { await api.delete(`/api/subtasks/${id}`); setSubtasks(prev => prev.filter(s => s.id !== id)); } catch { } }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl clay-card border-0 !rounded-2xl max-h-[85vh] flex flex-col">
        <DialogHeader><DialogTitle className="text-2xl font-semibold">Task Details</DialogTitle></DialogHeader>

        {/* Tabs */}
        <div className="flex p-1 clay-pressed !rounded-full mb-4">
          {(['details', 'comments', 'subtasks'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-xs font-bold tracking-wider clay-transition flex-1 ${tab === t ? 'bg-popover text-primary shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.8)]' : 'text-muted-foreground'}`}>
              {t === 'details' ? 'Details' : t === 'comments' ? `Comments (${comments.length})` : `Subtasks (${subtasks.filter(s=>s.completed).length}/${subtasks.length})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto py-2 min-h-0">
          {tab === 'details' && (
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} disabled={!canEdit} className="clay-input w-full py-3.5 px-5 text-sm text-foreground font-medium disabled:opacity-50" /></div>
              <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={!canEdit} rows={3} className="clay-input-rect w-full px-5 py-3.5 text-sm text-foreground font-medium resize-none disabled:opacity-50 !rounded-2xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} disabled={!canEdit} className="clay-input w-full py-3.5 px-5 text-sm text-foreground font-medium">
                    <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="done">Done</option></select></div>
                <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} disabled={!canEdit} className="clay-input w-full py-3.5 px-5 text-sm text-foreground font-medium">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Assign To</label>
                  <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} disabled={!canEdit} className="clay-input w-full py-3.5 px-5 text-sm text-foreground font-medium">
                    <option value="">Unassigned</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                <div><label className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2 block ml-4">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={!canEdit} className="clay-input w-full py-3.5 px-5 text-sm text-foreground font-medium" /></div>
              </div>
            </div>
          )}
          {tab === 'comments' && (
            <div className="space-y-3">
              {comments.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No comments yet</p>}
              {comments.map(c => (
                <div key={c.id} className="clay-card-sm p-4">
                  <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-foreground">{c.user_name}</span><span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span></div>
                  <p className="text-sm text-foreground">{c.content}</p>
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="clay-input flex-1 py-2.5 px-5 text-sm" onKeyDown={e => { if (e.key === 'Enter') addComment(); }} />
                <button onClick={addComment} className="clay-btn px-5 py-2.5 text-sm font-semibold">Post</button>
              </div>
            </div>
          )}
          {tab === 'subtasks' && (
            <div className="space-y-2">
              {subtasks.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No subtasks yet</p>}
              {subtasks.map(s => (
                <div key={s.id} className="flex items-center gap-3 clay-card-sm p-3">
                  <button onClick={() => toggleSubtask(s.id)} className={`w-5 h-5 rounded-full flex items-center justify-center clay-transition ${s.completed ? 'clay-pressed' : 'clay-btn-ghost'}`}>
                    {s.completed && <span className="material-symbols-outlined text-primary text-[14px]">check</span>}
                  </button>
                  <span className={`flex-1 text-sm ${s.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{s.title}</span>
                  <button onClick={() => deleteSubtask(s.id)} className="material-symbols-outlined text-[16px] text-muted-foreground hover:text-destructive clay-transition">close</button>
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)} placeholder="Add subtask..." className="clay-input flex-1 py-2.5 px-5 text-sm" onKeyDown={e => { if (e.key === 'Enter') addSubtask(); }} />
                <button onClick={addSubtask} className="clay-btn px-5 py-2.5 text-sm font-semibold">Add</button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between pt-4">
          <div>{isAdmin && <button onClick={handleDelete} className="clay-btn-ghost px-4 py-2 text-sm font-semibold text-destructive">Delete Task</button>}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="clay-btn-ghost px-5 py-2.5 text-sm font-semibold text-muted-foreground">Cancel</button>
            {canEdit && <button onClick={handleSave} disabled={saving} className="clay-btn px-6 py-2.5 text-sm font-semibold flex items-center gap-2">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : 'Save Changes'}</button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
