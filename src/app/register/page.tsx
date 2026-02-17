'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ArrowLeft, UserPlus, Mail, Lock, User, GraduationCap, CreditCard, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', name: '', id: '', major: '' });
  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { alert("รหัสผ่านไม่ตรงกัน"); return; }
    if (form.password.length < 6) { alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid, email: form.email, name: form.name, role,
        studentId: role === 'student' ? form.id : null,
        major: role === 'student' ? form.major : null,
        createdAt: new Date().toISOString()
      });
      alert("ลงทะเบียนสำเร็จ!"); router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') alert("อีเมลนี้ถูกใช้งานแล้ว");
      else if (err.code === 'auth/weak-password') alert("รหัสผ่านสั้นเกินไป");
      else if (err.code === 'auth/invalid-email') alert("รูปแบบอีเมลไม่ถูกต้อง");
      else alert("เกิดข้อผิดพลาด: " + err.message);
    } finally { setLoading(false); }
  };

  const inputCls = "w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-[#1e553d] focus:ring-1 focus:ring-[#1e553d] focus:bg-white transition";
  const iconCls = "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4] p-4 font-sans text-gray-800">
      <div className="bg-white w-full max-w-[500px] rounded-[2.5rem] shadow-2xl overflow-hidden border border-green-50">
        <div className="bg-[#1e553d] p-6 text-white flex items-center gap-4 shadow-md">
          <Link href="/" className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition"><ArrowLeft size={20}/></Link>
          <h1 className="text-xl font-bold">ลงทะเบียนสมาชิก</h1>
        </div>

        <div className="p-8">
          <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8 border border-gray-200">
            {(['student', 'lecturer'] as const).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${role === r ? 'text-white bg-[#1e553d]' : 'text-gray-500 hover:text-gray-700'}`}>
                {r === 'student' ? <><User size={18}/> นักศึกษา</> : <><GraduationCap size={18}/> อาจารย์</>}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600 ml-1">อีเมลมหาวิทยาลัย</label>
              <div className="relative"><div className={iconCls}><Mail className="text-gray-400" size={18}/></div>
                <input required type="email" placeholder="example@snru.ac.th" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600 ml-1">รหัสผ่าน</label>
                <div className="relative"><div className={iconCls}><Lock className="text-gray-400" size={18}/></div>
                  <input required type="password" placeholder="******" className={inputCls} value={form.password} onChange={e => set('password', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600 ml-1">ยืนยันรหัสผ่าน</label>
                <div className="relative"><div className={iconCls}><Lock className="text-gray-400" size={18}/></div>
                  <input required type="password" placeholder="******" className={inputCls} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600 ml-1">ชื่อ-นามสกุล</label>
              <div className="relative"><div className={iconCls}><User className="text-gray-400" size={18}/></div>
                <input required type="text" placeholder={role === 'lecturer' ? "อาจารย์ ..." : "นาย/นางสาว ..."} className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
            </div>

            {role === 'student' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-600 ml-1">รหัสนักศึกษา</label>
                  <div className="relative"><div className={iconCls}><CreditCard className="text-gray-400" size={18}/></div>
                    <input required type="text" placeholder="รหัสประจำตัว 11 หลัก" className={inputCls} value={form.id} onChange={e => set('id', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-600 ml-1">สาขาวิชา</label>
                  <div className="relative"><div className={iconCls}><BookOpen className="text-gray-400" size={18}/></div>
                    <input required type="text" placeholder="เช่น นวัตกรรมและคอมพิวเตอร์ศึกษา" className={inputCls} value={form.major} onChange={e => set('major', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <button disabled={loading} type="submit" className="w-full bg-[#1e553d] text-white font-bold py-4 rounded-2xl hover:bg-[#16422f] transition mt-4 shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? 'กำลังบันทึก...' : <><UserPlus size={20}/> สมัครสมาชิก</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
