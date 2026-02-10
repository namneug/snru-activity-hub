'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { GraduationCap, User, Key, Eye, EyeOff, UserPlus, HelpCircle } from "lucide-react";
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState<'student' | 'lecturer'>('student');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));

      if (snap.exists()) {
        const u = snap.data();
        localStorage.setItem('user_name', u.name);
        localStorage.setItem('user_role', u.role);
        localStorage.setItem('user_uid', cred.user.uid);
        localStorage.setItem('user_email', u.email);
        if (u.studentId) localStorage.setItem('user_id', u.studentId);
        if (u.major) localStorage.setItem('user_major', u.major);

        router.push(u.role === 'lecturer' ? '/lecturer/dashboard' : '/student/dashboard');
      } else {
        alert("ไม่พบข้อมูลผู้ใช้ในระบบ");
        auth.signOut();
      }
    } catch (error: any) {
      const code = error.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') alert("รหัสผ่านไม่ถูกต้อง");
      else if (code === 'auth/user-not-found') alert("ไม่พบอีเมลนี้ในระบบ");
      else if (code === 'auth/too-many-requests') alert("ลองหลายครั้งเกินไป กรุณารอสักครู่");
      else alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    const e = email || prompt("กรุณากรอกอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่:");
    if (!e) return;
    try {
      await sendPasswordResetEmail(auth, e);
      alert(`ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ ${e} แล้ว\nกรุณาตรวจสอบในกล่องจดหมาย`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') alert("ไม่พบอีเมลนี้ในระบบ");
      else alert("เกิดข้อผิดพลาดในการส่งอีเมล");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4] p-4 font-sans">
      <div className="bg-white w-full max-w-[450px] rounded-[2.5rem] shadow-xl overflow-hidden">
        {/* Logo */}
        <div className="pt-12 pb-8 text-center bg-gray-50/50">
          <div className="bg-white w-24 h-24 rounded-3xl shadow-sm mx-auto flex items-center justify-center mb-4 border-4 border-white">
            <GraduationCap size={48} className="text-[#1e553d]" />
          </div>
          <h1 className="text-[2rem] font-bold text-[#1e553d] leading-tight">Activity Hub</h1>
          <p className="text-gray-500 text-lg">ระบบบันทึกกิจกรรมนักศึกษา</p>
        </div>

        <div className="p-8 pt-4">
          {/* Role Toggle */}
          <div className="flex bg-gray-100 p-1.5 rounded-full mb-8 relative">
            <button type="button" onClick={() => setActiveRole('student')}
              className={`flex-1 py-3 rounded-full text-sm font-bold transition-all duration-300 z-10 flex items-center justify-center gap-2 ${activeRole === 'student' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              <User size={18} /> นักศึกษา
            </button>
            <button type="button" onClick={() => setActiveRole('lecturer')}
              className={`flex-1 py-3 rounded-full text-sm font-bold transition-all duration-300 z-10 flex items-center justify-center gap-2 ${activeRole === 'lecturer' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              <GraduationCap size={18} /> เจ้าหน้าที่/อาจารย์
            </button>
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#1e553d] rounded-full transition-all duration-300 ease-in-out ${activeRole === 'student' ? 'left-1.5' : 'left-[calc(50%+3px)]'}`} />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2 ml-1">ชื่อผู้ใช้ / Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="text-gray-400" size={20} /></div>
                <input type="email" placeholder="กรอกอีเมล" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-[#1e553d] focus:bg-white transition text-gray-700 font-medium" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2 ml-1">รหัสผ่าน (Password)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Key className="text-gray-400" size={20} /></div>
                <input type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full pl-12 pr-12 py-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:border-[#1e553d] focus:bg-white transition text-gray-700 font-medium font-mono" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
              </div>
            </div>
            <div className="flex items-start gap-3 my-4 px-1">
              <input id="pdpa" type="checkbox" required className="w-5 h-5 mt-0.5 text-[#1e553d] border-gray-300 rounded focus:ring-[#1e553d]" />
              <label htmlFor="pdpa" className="text-xs text-gray-500 leading-5 cursor-pointer">ข้าพเจ้ายินยอมให้ประมวลผลข้อมูลส่วนบุคคลตามนโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)</label>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#1e553d] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#16422f] transition flex justify-center items-center gap-2 shadow-lg shadow-green-900/20 active:scale-[0.99] disabled:opacity-70">
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="mt-6 flex justify-center items-center gap-4 text-sm font-medium text-gray-500">
            <button type="button" onClick={handleForgotPassword} className="hover:text-[#1e553d] transition hover:underline">ลืมรหัสผ่าน?</button>
            <span className="text-gray-300">|</span>
            <button type="button" onClick={() => window.location.href = "mailto:namneug@snru.ac.th?subject=แจ้งปัญหา Activity Hub"} className="hover:text-[#1e553d] transition hover:underline flex items-center gap-1"><HelpCircle size={14}/> แจ้งปัญหา</button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-400 text-xs mb-3">ยังไม่มีบัญชีผู้ใช้งาน?</p>
            <Link href="/register" className="inline-flex items-center gap-2 text-[#1e553d] bg-green-50 px-6 py-3 rounded-xl font-bold hover:bg-green-100 transition text-sm"><UserPlus size={18}/> ลงทะเบียน</Link>
          </div>
        </div>
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">คณะครุศาสตร์ มหาวิทยาลัยราชภัฏสกลนคร</div>
      </div>
    </div>
  );
}
