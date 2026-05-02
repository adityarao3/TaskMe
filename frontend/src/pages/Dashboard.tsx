import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

interface DashboardData {
  totalTasks: number; completed: number; overdue: number;
  byStatus: { todo: number; in_progress: number; done: number };
  overdueTasks: Array<{ id: string; title: string; due_date: string; priority: string; project_name: string; assigned_to_name: string | null; }>;
  myTasks: Array<{ id: string; title: string; status: string; priority: string; due_date: string | null; project_name: string; project_id: string; }>;
  tasksByUser: Array<{ id: string; name: string; total: string; done: string; in_progress: string; todo: string; }>;
}

const statusLabels: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function DonutChart({ data, total }: { data: { label: string; value: number; color: string }[]; total: number }) {
  const size = 140, cx = 70, cy = 70, r = 50, stroke = 16;
  let offset = 0; const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={stroke} className="stroke-muted/30" />
      {data.map((d, i) => {
        const pct = total > 0 ? d.value / total : 0; const dashArray = `${pct * circ} ${circ}`; const dashOffset = -offset * circ; offset += pct;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={stroke} strokeDasharray={dashArray} strokeDashoffset={dashOffset} transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round" className="transition-all duration-700" />;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" className="text-2xl font-bold fill-foreground">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="text-[10px] uppercase fill-muted-foreground font-bold tracking-widest">Tasks</text>
    </svg>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/api/dashboard').then(r => setData(r.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="p-8 w-full"><div className="animate-pulse space-y-6"><div className="h-10 w-60 clay-card" /><div className="grid grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-40 clay-card" />)}</div></div></div>;
  if (!data) return null;

  const { totalTasks, completed, overdue, byStatus, overdueTasks, myTasks } = data;
  const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  const chartData = [
    { label: 'To Do', value: byStatus.todo, color: '#c7c7bf' },
    { label: 'In Progress', value: byStatus.in_progress, color: '#496551' },
    { label: 'Done', value: byStatus.done, color: '#afceb6' },
  ];

  return (
    <div className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-[40px] font-bold tracking-tight text-foreground leading-[1.2]">Dashboard</h1>
        <p className="text-base text-muted-foreground mt-1">Overview of your task progress</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* KPI Cards */}
        {[
          { label: 'TOTAL TASKS', value: totalTasks, icon: 'assignment', sub: `${byStatus.in_progress} in progress`, accent: false },
          { label: 'COMPLETED', value: completed, icon: 'check_circle', sub: `${completionRate}% completion rate`, accent: false },
          { label: 'OVERDUE', value: overdue, icon: 'warning', sub: overdue === 0 ? 'All on track!' : 'Needs attention', accent: true },
        ].map((kpi, i) => (
          <div key={i} className="col-span-4 clay-card p-6 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${kpi.accent ? 'bg-destructive/10' : 'clay-pressed !rounded-2xl'}`}>
              <span className={`material-symbols-outlined fill text-[24px] ${kpi.accent ? 'text-destructive' : 'text-primary'}`}>{kpi.icon}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground tracking-widest">{kpi.label}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </div>
          </div>
        ))}

        {/* Chart */}
        <div className="col-span-4 mt-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Distribution</h2>
          <div className="clay-card p-6 flex flex-col items-center gap-5">
            <DonutChart data={chartData} total={totalTasks} />
            <div className="w-full space-y-3">
              {chartData.map(d => (
                <div key={d.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-xs font-semibold text-muted-foreground">{d.label}</span></div>
                  <span className="text-sm font-bold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My Tasks */}
        <div className="col-span-8 mt-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">My Tasks</h2>
          <div className="clay-card p-2 overflow-hidden">
            {myTasks.length > 0 ? myTasks.map((task) => {
              const daysLeft = task.due_date ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000) : null;
              return (
                <Link key={task.id} to={`/projects/${task.project_id}`} className="flex items-center px-5 py-3 rounded-xl clay-transition hover:bg-accent/50">
                  <div className="clay-pressed !rounded-xl w-8 h-8 flex items-center justify-center mr-4 shrink-0">
                    <span className={`material-symbols-outlined text-[16px] ${task.priority === 'high' ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {task.status === 'done' ? 'check' : task.status === 'in_progress' ? 'pending' : 'radio_button_unchecked'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground truncate">{task.title}</p><p className="text-[11px] text-muted-foreground">{task.project_name}</p></div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${task.priority === 'high' ? 'text-destructive bg-destructive/10' : task.priority === 'medium' ? 'text-primary bg-secondary' : 'text-muted-foreground bg-muted'}`}>{task.priority}</span>
                  <div className="w-20 text-right ml-3">
                    {daysLeft !== null ? (daysLeft < 0 ? <span className="text-[11px] font-bold text-destructive">OVERDUE</span> : daysLeft <= 3 ? <span className="text-[11px] font-bold text-amber-600">{daysLeft}d left</span> : <span className="text-[11px] text-muted-foreground">{new Date(task.due_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>) : <span className="text-[11px] text-muted-foreground">—</span>}
                  </div>
                </Link>
              );
            }) : <div className="px-5 py-10 text-center text-muted-foreground text-sm">No tasks assigned yet</div>}
          </div>
        </div>

        {/* Tasks per user */}
        {data.tasksByUser && data.tasksByUser.length > 0 && (
          <div className="col-span-12 mt-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Team Workload</h2>
            <div className="clay-card p-2">
              {data.tasksByUser.map(u => {
                const total = Number(u.total); const done = Number(u.done); const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={u.id} className="flex items-center px-5 py-3 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center mr-4 shrink-0">
                      <span className="text-[11px] font-bold text-secondary-foreground">{u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</span>
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground">{u.name}</p><p className="text-[11px] text-muted-foreground">{u.done} done · {u.in_progress} active · {u.todo} pending</p></div>
                    <div className="w-32 flex items-center gap-2 ml-4">
                      <div className="flex-1 h-2 rounded-full overflow-hidden bg-muted/50"><div className="h-full rounded-full bg-primary clay-transition" style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs font-bold text-foreground w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <div className="col-span-12 mt-6">
            <h2 className="text-2xl font-semibold text-destructive mb-4 flex items-center gap-2"><span className="material-symbols-outlined fill text-[22px]">warning</span>Overdue Tasks</h2>
            <div className="clay-card p-2">
              {overdueTasks.map(task => (
                <div key={task.id} className="flex items-center px-5 py-3 rounded-xl">
                  <div className="flex-1"><p className="text-sm font-semibold text-foreground">{task.title}</p><p className="text-[11px] text-muted-foreground">{task.project_name}</p></div>
                  <span className="text-xs text-destructive font-bold">{new Date(task.due_date).toLocaleDateString()}</span>
                  <span className={`ml-4 text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${task.priority === 'high' ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-muted'}`}>{task.priority}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {totalTasks === 0 && (
        <div className="clay-card p-16 text-center mt-8">
          <div className="clay-pressed !rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4"><span className="material-symbols-outlined text-primary text-3xl">checklist</span></div>
          <h3 className="text-2xl font-semibold text-foreground mb-2">No Tasks Yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">Create a project and start adding tasks to see your dashboard.</p>
          <Link to="/projects"><button className="mt-6 clay-btn px-8 py-3 font-semibold text-[15px]">Go to Projects</button></Link>
        </div>
      )}
    </div>
  );
}
