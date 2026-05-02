import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

interface CalTask { id: string; title: string; status: string; priority: string; due_date: string; project_name: string; project_id: string; }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function CalendarView() {
  const [tasks, setTasks] = useState<CalTask[]>([]); const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear(); const month = currentDate.getMonth();

  useEffect(() => {
    api.get('/api/dashboard').then(r => {
      const all = [...(r.data.myTasks || []), ...(r.data.overdueTasks || [])];
      const map = new Map<string, CalTask>(); all.forEach((t: any) => { if (t.due_date) map.set(t.id, t); });
      setTasks(Array.from(map.values()));
    }).finally(() => setLoading(false));
  }, []);

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday start
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.due_date?.startsWith(dateStr));
  };

  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  const remaining = 7 - (cells.length % 7); if (remaining < 7) for (let i = 1; i <= remaining; i++) cells.push({ day: i, current: false });

  if (loading) return <div className="p-8 w-full animate-pulse"><div className="h-10 w-60 clay-card mb-6" /><div className="h-[500px] clay-card" /></div>;

  return (
    <div className="p-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h1 className="text-[40px] font-bold tracking-tight text-foreground leading-[1.2]">Calendar</h1>
          <p className="text-base text-muted-foreground">{MONTHS[month]} {year}</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button onClick={() => setCurrentDate(new Date())} className="clay-btn px-6 py-3 font-semibold text-[15px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">today</span>Today
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="clay-btn-ghost w-10 h-10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_left</span>
        </button>
        <span className="text-[15px] font-bold text-foreground min-w-[140px] text-center">{MONTHS[month]} {year}</span>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="clay-btn-ghost w-10 h-10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-muted-foreground">chevron_right</span>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="clay-card p-6">
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-bold text-muted-foreground tracking-widest uppercase">{d}</div>)}
        </div>
        {/* Cells */}
        <div className="grid grid-cols-7 gap-4">
          {cells.map((cell, i) => {
            const dayTasks = cell.current ? getTasksForDay(cell.day) : [];
            const isToday = cell.current && cell.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            return (
              <div key={i} className={`clay-day p-2 min-h-[100px] ${!cell.current ? 'opacity-40' : ''} ${isToday ? '!bg-secondary !shadow-[inset_3px_3px_6px_rgba(0,0,0,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]' : ''}`}>
                <span className={`text-[15px] font-semibold ${isToday ? 'text-secondary-foreground' : 'text-foreground'}`}>{cell.day}</span>
                {cell.current && (
                  <div className="mt-1 space-y-1">
                    {dayTasks.slice(0, 2).map(t => (
                      <Link key={t.id} to={`/projects/${t.project_id}`}
                        className={`block text-[9px] px-2 py-0.5 rounded-xl truncate font-semibold clay-event clay-transition hover:translate-y-[-1px] ${
                          t.priority === 'high' ? '!bg-destructive/10 !text-destructive' : t.status === 'done' ? 'opacity-50 line-through' : ''
                        }`}>{t.title}</Link>
                    ))}
                    {dayTasks.length > 2 && <span className="text-[9px] text-muted-foreground font-bold">+{dayTasks.length - 2}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
