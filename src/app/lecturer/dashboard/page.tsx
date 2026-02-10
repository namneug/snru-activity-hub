'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../firebase/config';
import {
  collection, addDoc, getDocs, query, where, onSnapshot,
  deleteDoc, doc, serverTimestamp, updateDoc
} from 'firebase/firestore';
import {
  LogOut, Plus, QrCode, Users, Printer, Trash2, Edit2,
  X, Calendar, ClipboardList, Download, GraduationCap,
  CheckCircle, ChevronRight, Star, FileSpreadsheet, Save,
  BarChart3, MessageSquare, TrendingUp, Megaphone, Send
} from 'lucide-react';
import StarRating from '../../../components/StarRating';

export default function LecturerDashboard() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', date: '' });
  const [saving, setSaving] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  useEffect(() => {
    const n = localStorage.getItem('user_name');
    const r = localStorage.getItem('user_role');
    if (!n || r !== 'lecturer') { router.push('/'); return; }
    setName(n);
    const unsub = onSnapshot(query(collection(db, 'activities')), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setActivities(data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, () => setLoading(false));

    // โหลดประกาศ
    const unsubAnn = onSnapshot(query(collection(db, 'announcements')), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAnnouncements(data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    return () => { unsub(); unsubAnn(); };
  }, [router]);

  const handleLogout = () => { localStorage.clear(); router.push('/'); };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim()) { alert('กรุณากรอกหัวข้อประกาศ'); return; }
    setSendingAnnouncement(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: announcementTitle.trim(),
        message: announcementText.trim(),
        createdBy: name,
        createdAt: serverTimestamp()
      });
      setAnnouncementTitle(''); setAnnouncementText('');
      setShowAnnouncementModal(false);
    } catch { alert('ส่งประกาศไม่สำเร็จ'); }
    finally { setSendingAnnouncement(false); }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('ต้องการลบประกาศนี้?')) return;
    try { await deleteDoc(doc(db, 'announcements', id)); } catch { alert('ลบไม่สำเร็จ'); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert('กรุณากรอกชื่อกิจกรรม'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'activities'), {
        name: formData.name.trim(), description: formData.description.trim(),
        date: formData.date, createdBy: name,
        createdByUid: localStorage.getItem('user_uid'),
        createdAt: serverTimestamp(), status: 'active'
      });
      setFormData({ name: '', description: '', date: '' });
      setShowCreateModal(false);
    } catch { alert('เกิดข้อผิดพลาด'); } finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !formData.name.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'activities', selectedActivity.id), {
        name: formData.name.trim(), description: formData.description.trim(), date: formData.date
      });
      setShowEditModal(false);
    } catch { alert('แก้ไขไม่สำเร็จ'); } finally { setSaving(false); }
  };

  const openEdit = (act: any) => {
    setSelectedActivity(act);
    setFormData({ name: act.name, description: act.description || '', date: act.date || '' });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบกิจกรรมนี้?')) return;
    try { await deleteDoc(doc(db, 'activities', id)); } catch { alert('ลบไม่สำเร็จ'); }
  };

  const viewCheckins = async (act: any) => {
    setSelectedActivity(act); setShowCheckinModal(true); setCheckinLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'checkins'), where('activityId', '==', act.id)));
      setCheckins(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)));
    } catch { } finally { setCheckinLoading(false); }
  };

  const ratedCheckins = checkins.filter(c => c.rating);
  const avgRating = ratedCheckins.length > 0 ? ratedCheckins.reduce((s, c) => s + c.rating, 0) / ratedCheckins.length : 0;
  const commentsOnly = checkins.filter(c => c.comment?.trim());

  const handleExportCSV = () => {
    if (!checkins.length) { alert('ไม่มีข้อมูล'); return; }
    const BOM = '\uFEFF';
    const header = 'ลำดับ,ชื่อ-นามสกุล,รหัสนักศึกษา,เวลาเช็คอิน,คะแนน,ความคิดเห็น\n';
    const rows = checkins.map((c, i) => {
      const t = c.timestamp?.toDate ? c.timestamp.toDate().toLocaleString('th-TH') : '-';
      return `${i+1},"${c.studentName||'-'}","${c.studentId||'-'}","${t}",${c.rating||'-'},"${(c.comment||'').replace(/"/g,'""')}"`;
    }).join('\n');
    const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `checkin-${selectedActivity?.name || 'report'}.csv`;
    a.click();
  };

  const handlePrint = () => {
    if (!selectedActivity) return;
    const w = window.open('', '_blank');
    if (!w) { alert('กรุณาอนุญาต popup'); return; }
    const stars = (r: number) => '★'.repeat(r) + '☆'.repeat(5 - r);
    w.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
    <title>รายงาน - ${selectedActivity.name}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Sarabun','Segoe UI',sans-serif;padding:40px;color:#333;font-size:14px}.header{text-align:center;margin-bottom:30px;border-bottom:3px solid #1e553d;padding-bottom:20px}.header h1{font-size:18px;color:#1e553d}.header h2{font-size:22px;margin:6px 0}.header p{color:#666}.info p{margin-bottom:3px}.stats{display:flex;gap:20px;margin:20px 0;padding:15px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb}.stats div{flex:1;text-align:center}.stats .num{font-size:28px;font-weight:bold;color:#1e553d}.stats .label{font-size:12px;color:#666}table{width:100%;border-collapse:collapse;margin-top:15px}th{background:#1e553d;color:white;padding:10px 8px;text-align:left;font-size:13px}td{padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px}tr:nth-child(even){background:#f9fafb}.comments{margin-top:25px}.comments h3{margin-bottom:10px;color:#1e553d}.ci{padding:10px;border-left:3px solid #1e553d;margin-bottom:8px;background:#f9fafb;border-radius:0 8px 8px 0}.ci .m{font-size:11px;color:#666;margin-top:4px}.footer{margin-top:30px;text-align:center;font-size:11px;color:#999;border-top:1px solid #e5e7eb;padding-top:15px}.st{color:#f59e0b;letter-spacing:2px}@media print{body{padding:20px}}</style></head><body>
    <div class="header"><h1>คณะครุศาสตร์ มหาวิทยาลัยราชภัฏสกลนคร</h1><h2>รายงานการเข้าร่วมกิจกรรม</h2><p>ระบบ Activity Hub</p></div>
    <div class="info"><p><b>ชื่อกิจกรรม:</b> ${selectedActivity.name}</p><p><b>รายละเอียด:</b> ${selectedActivity.description||'-'}</p><p><b>วันที่จัด:</b> ${selectedActivity.date||'-'}</p><p><b>ผู้สร้าง:</b> ${selectedActivity.createdBy||'-'}</p><p><b>วันที่พิมพ์:</b> ${new Date().toLocaleString('th-TH')}</p></div>
    <div class="stats"><div><div class="num">${checkins.length}</div><div class="label">ผู้เข้าร่วม</div></div><div><div class="num">${avgRating>0?avgRating.toFixed(1):'-'}</div><div class="label">คะแนนเฉลี่ย</div></div><div><div class="num">${commentsOnly.length}</div><div class="label">ความคิดเห็น</div></div></div>
    <table><thead><tr><th>ลำดับ</th><th>ชื่อ-นามสกุล</th><th>รหัส</th><th>เวลา</th><th>คะแนน</th></tr></thead><tbody>
    ${checkins.map((c,i)=>`<tr><td>${i+1}</td><td>${c.studentName||'-'}</td><td>${c.studentId||'-'}</td><td>${c.timestamp?.toDate?c.timestamp.toDate().toLocaleString('th-TH'):'-'}</td><td class="st">${c.rating?stars(c.rating):'-'}</td></tr>`).join('')}
    ${!checkins.length?'<tr><td colspan="5" style="text-align:center;padding:20px;color:#999">ไม่มีข้อมูล</td></tr>':''}
    </tbody></table>
    ${commentsOnly.length?`<div class="comments"><h3>ความคิดเห็น (${commentsOnly.length})</h3>${commentsOnly.map(c=>`<div class="ci"><div>"${c.comment}"</div><div class="m">${c.studentName||'-'} | <span class="st">${c.rating?stars(c.rating):''}</span></div></div>`).join('')}</div>`:''}
    <div class="footer">Activity Hub - คณะครุศาสตร์ มหาวิทยาลัยราชภัฏสกลนคร</div></body></html>`);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };

  const qrURL = (id: string, n: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify({activityId:id,activityName:n}))}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-800">
      <div className="bg-[#1e553d] p-8 text-white rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"/><div className="absolute -bottom-5 -left-5 w-24 h-24 bg-white rounded-full"/></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="bg-white/20 p-3 rounded-2xl"><GraduationCap size={24}/></div>
            <button onClick={handleLogout} className="text-white/70 hover:text-white transition hover:bg-white/10 p-2 rounded-lg flex items-center gap-2 text-sm"><LogOut size={20}/> ออกจากระบบ</button>
          </div>
          <h1 className="text-2xl font-bold">สวัสดี, {name}</h1>
          <p className="text-green-100 text-sm opacity-80 mt-1">แดชบอร์ดเจ้าหน้าที่/อาจารย์</p>
        </div>
      </div>

      <div className="p-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="flex items-center gap-3"><div className="bg-blue-50 text-blue-600 p-2 rounded-xl"><ClipboardList size={20}/></div><div><p className="text-2xl font-bold">{activities.length}</p><p className="text-xs text-gray-400">กิจกรรมทั้งหมด</p></div></div></div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><div className="flex items-center gap-3"><div className="bg-green-50 text-green-600 p-2 rounded-xl"><TrendingUp size={20}/></div><div><p className="text-2xl font-bold">{activities.filter(a=>a.status==='active').length}</p><p className="text-xs text-gray-400">กิจกรรมที่เปิด</p></div></div></div>
        </div>

        <button onClick={()=>{setFormData({name:'',description:'',date:''});setShowCreateModal(true);}} className="w-full bg-white p-5 rounded-[2rem] shadow-sm flex items-center justify-between group active:scale-95 transition-all mb-4 border border-green-50 hover:shadow-md">
          <div className="flex items-center gap-4"><div className="bg-[#1e553d] text-white p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><Plus size={28}/></div><div className="text-left"><h2 className="font-bold text-gray-800 text-lg">สร้างกิจกรรมใหม่</h2><p className="text-gray-400 text-sm">สร้างกิจกรรมพร้อม QR Code</p></div></div>
          <ChevronRight size={24} className="text-gray-300 group-hover:text-[#1e553d] transition"/>
        </button>

        {/* ปุ่มส่งประกาศ */}
        <button onClick={()=>setShowAnnouncementModal(true)} className="w-full bg-white p-5 rounded-[2rem] shadow-sm flex items-center justify-between group active:scale-95 transition-all mb-6 border border-orange-50 hover:shadow-md">
          <div className="flex items-center gap-4"><div className="bg-orange-500 text-white p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform"><Megaphone size={28}/></div><div className="text-left"><h2 className="font-bold text-gray-800 text-lg">ส่งประกาศถึงนักศึกษา</h2><p className="text-gray-400 text-sm">แจ้งข่าวสาร ประกาศสำคัญ</p></div></div>
          <ChevronRight size={24} className="text-gray-300 group-hover:text-orange-500 transition"/>
        </button>

        {/* รายการประกาศล่าสุด */}
        {announcements.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 px-2"><Megaphone size={18}/> ประกาศล่าสุด</h3>
            <div className="space-y-2">
              {announcements.slice(0,3).map(ann=>(
                <div key={ann.id} className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">{ann.title}</p>
                    {ann.message && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{ann.message}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{ann.createdAt?.toDate ? ann.createdAt.toDate().toLocaleString('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}</p>
                  </div>
                  <button onClick={()=>handleDeleteAnnouncement(ann.id)} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 px-2"><ClipboardList size={18}/> รายการกิจกรรม</h3>
        <div className="space-y-4">
          {loading ? <div className="bg-white rounded-[2rem] p-10 text-center text-gray-400 shadow-sm"><div className="animate-spin w-8 h-8 border-2 border-[#1e553d] border-t-transparent rounded-full mx-auto mb-3"/>กำลังโหลด...</div>
          : activities.length > 0 ? activities.map(act=>(
            <div key={act.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0"><h4 className="font-bold text-gray-800 truncate">{act.name}</h4>{act.description&&<p className="text-gray-400 text-sm mt-1 line-clamp-2">{act.description}</p>}</div>
                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${act.status==='active'?'bg-green-50 text-green-600':'bg-gray-100 text-gray-500'}`}>{act.status==='active'?'เปิด':'ปิด'}</span>
              </div>
              {act.date&&<p className="text-xs text-gray-400 flex items-center gap-1 mb-3"><Calendar size={12}/>{act.date}</p>}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button onClick={()=>{setSelectedActivity(act);setShowQRModal(true);}} className="flex-1 min-w-[70px] bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5"><QrCode size={16}/>QR</button>
                <button onClick={()=>viewCheckins(act)} className="flex-1 min-w-[70px] bg-[#1e553d] hover:bg-[#16422f] text-white py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5"><Users size={16}/>รายชื่อ</button>
                <button onClick={()=>openEdit(act)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2.5 rounded-xl transition"><Edit2 size={16}/></button>
                <button onClick={()=>handleDelete(act.id)} className="bg-red-50 hover:bg-red-100 text-red-500 p-2.5 rounded-xl transition"><Trash2 size={16}/></button>
              </div>
            </div>
          )) : <div className="bg-white rounded-[2rem] p-10 text-center text-gray-400 italic text-sm shadow-sm"><div className="text-4xl mb-3">📋</div>ยังไม่มีกิจกรรม</div>}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal||showEditModal)&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="bg-[#1e553d] p-5 text-white flex items-center justify-between">
              <h2 className="font-bold text-lg">{showEditModal?'แก้ไขกิจกรรม':'สร้างกิจกรรมใหม่'}</h2>
              <button onClick={()=>{setShowCreateModal(false);setShowEditModal(false);}} className="bg-white/20 p-1.5 rounded-lg hover:bg-white/30"><X size={20}/></button>
            </div>
            <form onSubmit={showEditModal?handleEdit:handleCreate} className="p-6 space-y-4">
              <div><label className="text-sm font-semibold text-gray-600 block mb-1">ชื่อกิจกรรม *</label><input required type="text" placeholder="เช่น อบรมจริยธรรมวิชาชีพครู" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#1e553d] focus:ring-1 focus:ring-[#1e553d] outline-none transition" value={formData.name} onChange={e=>setFormData(p=>({...p,name:e.target.value}))}/></div>
              <div><label className="text-sm font-semibold text-gray-600 block mb-1">รายละเอียด</label><textarea placeholder="อธิบายรายละเอียด..." rows={3} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#1e553d] focus:ring-1 focus:ring-[#1e553d] outline-none transition resize-none" value={formData.description} onChange={e=>setFormData(p=>({...p,description:e.target.value}))}/></div>
              <div><label className="text-sm font-semibold text-gray-600 block mb-1">วันที่จัด</label><input type="date" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#1e553d] focus:ring-1 focus:ring-[#1e553d] outline-none transition" value={formData.date} onChange={e=>setFormData(p=>({...p,date:e.target.value}))}/></div>
              <button type="submit" disabled={saving} className="w-full bg-[#1e553d] text-white py-4 rounded-2xl font-bold hover:bg-[#16422f] transition shadow-lg disabled:opacity-70 flex items-center justify-center gap-2">{saving?'กำลังบันทึก...':<><Save size={20}/>{showEditModal?'บันทึกการแก้ไข':'สร้างกิจกรรม'}</>}</button>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal&&selectedActivity&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="bg-[#1e553d] p-5 text-white flex items-center justify-between"><h2 className="font-bold text-lg">QR Code</h2><button onClick={()=>setShowQRModal(false)} className="bg-white/20 p-1.5 rounded-lg hover:bg-white/30"><X size={20}/></button></div>
            <div className="p-6 text-center">
              <p className="font-bold text-gray-800 mb-1">{selectedActivity.name}</p>
              <p className="text-gray-400 text-sm mb-6">ให้นักศึกษาสแกน QR Code นี้</p>
              <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 inline-block shadow-sm"><img src={qrURL(selectedActivity.id,selectedActivity.name)} alt="QR" className="w-64 h-64"/></div>
              {/* รหัสกิจกรรม - แสดงชัดเจน */}
              <div className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <p className="text-xs text-gray-400 mb-1">รหัสกิจกรรม (Activity ID)</p>
                <p className="text-lg font-bold text-[#1e553d] break-all select-all tracking-wide">{selectedActivity.id}</p>
                <button onClick={()=>{navigator.clipboard.writeText(selectedActivity.id);alert('คัดลอกรหัสแล้ว!');}} className="mt-2 text-xs text-[#1e553d] bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition font-medium">📋 คัดลอกรหัส</button>
              </div>
              <button onClick={()=>{const a=document.createElement('a');a.href=qrURL(selectedActivity.id,selectedActivity.name);a.download=`QR-${selectedActivity.name}.png`;a.click();}} className="mt-4 w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"><Download size={18}/>ดาวน์โหลด QR</button>
            </div>
          </div>
        </div>
      )}

      {/* Checkins Modal */}
      {showCheckinModal&&selectedActivity&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
            <div className="bg-[#1e553d] p-5 text-white flex items-center justify-between flex-shrink-0">
              <div className="min-w-0"><h2 className="font-bold text-lg truncate">{selectedActivity.name}</h2><p className="text-green-100 text-xs">รายชื่อและผลประเมิน</p></div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={handleExportCSV} className="bg-white/20 p-2 rounded-lg hover:bg-white/30" title="CSV"><FileSpreadsheet size={18}/></button>
                <button onClick={handlePrint} className="bg-white/20 p-2 rounded-lg hover:bg-white/30" title="พิมพ์"><Printer size={18}/></button>
                <button onClick={()=>setShowCheckinModal(false)} className="bg-white/20 p-1.5 rounded-lg hover:bg-white/30"><X size={20}/></button>
              </div>
            </div>
            {checkinLoading?<div className="p-10 text-center text-gray-400"><div className="animate-spin w-8 h-8 border-2 border-[#1e553d] border-t-transparent rounded-full mx-auto mb-3"/>กำลังโหลด...</div>:(
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-3 gap-3">
                <div className="text-center"><div className="flex items-center justify-center gap-1"><Users size={14} className="text-[#1e553d]"/><span className="text-xl font-bold">{checkins.length}</span></div><p className="text-[10px] text-gray-400">ผู้เข้าร่วม</p></div>
                <div className="text-center"><div className="flex items-center justify-center gap-1"><Star size={14} className="text-yellow-500"/><span className="text-xl font-bold">{avgRating>0?avgRating.toFixed(1):'-'}</span></div><p className="text-[10px] text-gray-400">คะแนนเฉลี่ย</p></div>
                <div className="text-center"><div className="flex items-center justify-center gap-1"><MessageSquare size={14} className="text-blue-500"/><span className="text-xl font-bold">{commentsOnly.length}</span></div><p className="text-[10px] text-gray-400">ความคิดเห็น</p></div>
              </div>
              {ratedCheckins.length>0&&(
                <div className="p-4 border-b border-gray-100 bg-yellow-50/50">
                  <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1"><BarChart3 size={14}/>การกระจายคะแนน</p>
                  <div className="space-y-1.5">{[5,4,3,2,1].map(s=>{const c=ratedCheckins.filter(x=>x.rating===s).length;const p=ratedCheckins.length?(c/ratedCheckins.length)*100:0;return(
                    <div key={s} className="flex items-center gap-2 text-xs"><span className="w-3 text-gray-500 text-right">{s}</span><Star size={12} className="fill-yellow-400 text-yellow-400 flex-shrink-0"/><div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full transition-all" style={{width:`${p}%`}}/></div><span className="w-8 text-gray-400 text-right">{c}</span></div>
                  );})}</div>
                </div>
              )}
              <div className="p-3 border-b border-gray-100 flex gap-2">
                <button onClick={handleExportCSV} className="flex-1 bg-green-50 text-green-700 py-2.5 rounded-xl text-sm font-medium hover:bg-green-100 transition flex items-center justify-center gap-1.5"><FileSpreadsheet size={14}/>ส่งออก CSV</button>
                <button onClick={handlePrint} className="flex-1 bg-blue-50 text-blue-700 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-1.5"><Printer size={14}/>พิมพ์ / PDF</button>
              </div>
              {checkins.length>0?checkins.map((c,i)=>(
                <div key={c.id} className="p-4 border-b border-gray-50 flex items-start gap-3 hover:bg-gray-50 transition">
                  <div className="bg-[#1e553d] text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{c.studentName||'-'}</p>
                    <p className="text-[11px] text-gray-400">รหัส: {c.studentId||'-'} | {c.timestamp?.toDate?c.timestamp.toDate().toLocaleString('th-TH',{hour:'2-digit',minute:'2-digit'}):'-'}</p>
                    {c.rating&&<div className="flex items-center gap-2 mt-1"><div className="flex">{[1,2,3,4,5].map(s=><Star key={s} size={11} className={s<=c.rating?'fill-yellow-400 text-yellow-400':'fill-gray-200 text-gray-200'}/>)}</div>{c.comment&&<p className="text-[10px] text-gray-400 italic truncate">&ldquo;{c.comment}&rdquo;</p>}</div>}
                  </div>
                </div>
              )):<div className="p-10 text-center text-gray-400 italic text-sm"><div className="text-4xl mb-3">📋</div>ยังไม่มีผู้เช็คอิน</div>}
            </div>)}
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="bg-orange-500 p-5 text-white flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2"><Megaphone size={22}/>ส่งประกาศ</h2>
              <button onClick={()=>setShowAnnouncementModal(false)} className="bg-white/20 p-1.5 rounded-lg hover:bg-white/30"><X size={20}/></button>
            </div>
            <form onSubmit={handleSendAnnouncement} className="p-6 space-y-4">
              <div><label className="text-sm font-semibold text-gray-600 block mb-1">หัวข้อประกาศ *</label><input required type="text" placeholder="เช่น แจ้งเปลี่ยนแปลงวันจัดกิจกรรม" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none transition" value={announcementTitle} onChange={e=>setAnnouncementTitle(e.target.value)}/></div>
              <div><label className="text-sm font-semibold text-gray-600 block mb-1">รายละเอียด</label><textarea placeholder="เขียนรายละเอียดประกาศ..." rows={4} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none transition resize-none" value={announcementText} onChange={e=>setAnnouncementText(e.target.value)}/></div>
              <button type="submit" disabled={sendingAnnouncement} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold hover:bg-orange-600 transition shadow-lg disabled:opacity-70 flex items-center justify-center gap-2">{sendingAnnouncement?'กำลังส่ง...':<><Send size={20}/>ส่งประกาศ</>}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
