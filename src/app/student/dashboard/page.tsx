'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Scan, LogOut, User, CheckCircle, Clock, BookOpen, Star, Megaphone, Calendar, CalendarDays, ChevronRight } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [major, setMajor] = useState('');
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const n = localStorage.getItem('user_name');
    const id = localStorage.getItem('user_id');
    const r = localStorage.getItem('user_role');
    const m = localStorage.getItem('user_major');
    if (!n || r !== 'student') { router.push('/'); return; }
    setName(n); setStudentId(id || ''); setMajor(m || '');

    const unsubscribers: (() => void)[] = [];

    // ดึงประวัติการเช็คอิน
    if (id) {
      const q = query(collection(db, 'checkins'), where('studentId', '==', id));
      const unsub1 = onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setHistory(data.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
      });
      unsubscribers.push(unsub1);
    }

    // ดึงกิจกรรมที่กำลังจะมาถึง
    const unsub2 = onSnapshot(query(collection(db, 'activities')), (snap) => {
      const today = new Date().toISOString().split('T')[0];
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter((a: any) => a.status === 'active' && a.date && a.date >= today)
        .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));
      setUpcomingActivities(data);
    });
    unsubscribers.push(unsub2);

    // ดึงประกาศจากอาจารย์
    const unsub3 = onSnapshot(query(collection(db, 'announcements')), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAnnouncements(data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    unsubscribers.push(unsub3);

    return () => unsubscribers.forEach(u => u());
  }, [router]);

  const handleLogout = () => { localStorage.clear(); router.push('/'); };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  const daysUntil = (dateStr: string) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(dateStr + 'T00:00:00');
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000*60*60*24));
    if (diff === 0) return 'วันนี้';
    if (diff === 1) return 'พรุ่งนี้';
    return `อีก ${diff} วัน`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-800 pb-8">
      {/* Header */}
      <div className="bg-[#1e553d] p-8 text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-white rounded-full" />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="bg-white/20 p-3 rounded-2xl"><User size={24}/></div>
            <button onClick={handleLogout} className="text-white/70 hover:text-white transition hover:bg-white/10 p-2 rounded-lg flex items-center gap-2 text-sm">
              <LogOut size={20}/> ออกจากระบบ
            </button>
          </div>
          <h1 className="text-2xl font-bold">สวัสดี, {name}</h1>
          <p className="text-green-100 text-sm opacity-80 mt-1">ยินดีต้อนรับสู่ระบบ Activity Hub</p>
          {studentId && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="bg-white/15 text-white/90 px-3 py-1 rounded-full text-xs">รหัส: {studentId}</span>
              {major && <span className="bg-white/15 text-white/90 px-3 py-1 rounded-full text-xs flex items-center gap-1"><BookOpen size={12}/> {major}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 -mt-8 relative z-10 space-y-6">
        {/* ปุ่มสแกน QR */}
        <button onClick={() => router.push('/student/scan')}
          className="w-full bg-white p-6 rounded-[2.5rem] shadow-lg flex items-center justify-between group active:scale-95 transition-all border border-green-50 hover:shadow-xl">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-[#1e553d] text-white p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><Scan size={32}/></div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">สแกน QR Code</h2>
              <p className="text-gray-400 text-sm">บันทึกการเข้าร่วมกิจกรรม</p>
            </div>
          </div>
          <ChevronRight size={24} className="text-gray-300 group-hover:text-[#1e553d] transition"/>
        </button>

        {/* ประกาศจากอาจารย์ */}
        {announcements.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 px-2"><Megaphone size={18} className="text-orange-500"/> ประกาศ</h3>
            <div className="space-y-3">
              {announcements.slice(0, 5).map(ann => (
                <div key={ann.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-400 rounded-r"/>
                  <div className="pl-3">
                    <h4 className="font-bold text-gray-800 text-sm">{ann.title}</h4>
                    {ann.message && <p className="text-gray-500 text-xs mt-1">{ann.message}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[10px] text-gray-400">โดย {ann.createdBy || 'อาจารย์'}</p>
                      <p className="text-[10px] text-gray-400">{ann.createdAt?.toDate ? ann.createdAt.toDate().toLocaleString('th-TH', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* กิจกรรมที่กำลังจะมาถึง */}
        {upcomingActivities.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 px-2"><CalendarDays size={18} className="text-blue-500"/> กิจกรรมที่กำลังจะมาถึง</h3>
            <div className="space-y-3">
              {upcomingActivities.slice(0, 5).map(act => (
                <div key={act.id} className="bg-white rounded-2xl shadow-sm border border-blue-50 p-4 flex items-center gap-4 hover:shadow-md transition">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-xl text-center min-w-[56px]">
                    <div className="text-lg font-bold leading-none">{new Date(act.date + 'T00:00:00').getDate()}</div>
                    <div className="text-[10px] mt-0.5">{new Date(act.date + 'T00:00:00').toLocaleDateString('th-TH', { month:'short' })}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 text-sm truncate">{act.name}</h4>
                    {act.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{act.description}</p>}
                    <span className="inline-block mt-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{daysUntil(act.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ประวัติการเช็คอิน - แสดงชื่อกิจกรรม + เวลา */}
        <div>
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 px-2"><Clock size={18}/> ประวัติการเข้าร่วมกิจกรรม</h3>
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            {history.length > 0 ? history.slice(0, 20).map((item, i) => (
              <div key={item.id || i} className="p-4 border-b border-gray-50 last:border-0 flex items-center gap-4 hover:bg-gray-50 transition">
                <div className="bg-green-50 text-green-600 p-2.5 rounded-full flex-shrink-0"><CheckCircle size={20}/></div>
                <div className="flex-1 min-w-0">
                  {/* แสดงชื่อกิจกรรมแทนรหัส */}
                  <p className="font-bold text-gray-800 text-sm truncate">{item.activityName || item.activityId}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {/* แสดง timestamp ที่ลงทะเบียนเข้าร่วม */}
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock size={10}/>
                      {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString('th-TH', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      }) : 'กำลังบันทึก...'}
                    </p>
                    {/* แสดงคะแนนที่เคยให้ */}
                    {item.rating && (
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={10} className={s <= item.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}/>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-10 text-center text-gray-400 italic text-sm">
                <div className="text-4xl mb-3">📋</div>ยังไม่มีประวัติการเช็คอิน<br/>กดปุ่ม &quot;สแกน QR Code&quot; เพื่อเริ่มต้น
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
