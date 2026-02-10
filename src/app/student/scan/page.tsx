'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, Camera, CheckCircle, XCircle, AlertTriangle, Loader2, Send } from 'lucide-react';
import StarRating from '../../../components/StarRating';

export default function ScanQRPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const [status, setStatus] = useState<'idle' | 'scanning' | 'evaluate' | 'success' | 'error' | 'duplicate'>('idle');
  const [message, setMessage] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [scanning, setScanning] = useState(false);

  // Evaluation state
  const [scannedActivity, setScannedActivity] = useState<{ id: string; name: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const n = localStorage.getItem('user_name');
    const id = localStorage.getItem('user_id');
    const r = localStorage.getItem('user_role');
    if (!n || r !== 'student') { router.push('/'); return; }
    setStudentName(n); setStudentId(id || '');
    return () => stopCamera();
  }, [router]);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) { clearInterval(scanIntervalRef.current); scanIntervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setScanning(false);
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(''); setStatus('scanning'); setMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setScanning(true);

      // สแกนทุก 500ms
      scanIntervalRef.current = setInterval(() => scanFrame(), 500);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') setCameraError('กรุณาอนุญาตการเข้าถึงกล้องในการตั้งค่าเบราว์เซอร์');
      else if (err.name === 'NotFoundError') setCameraError('ไม่พบกล้องในอุปกรณ์นี้');
      else setCameraError('ไม่สามารถเปิดกล้องได้ กรุณาลองใหม่');
      setStatus('idle');
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || isProcessingRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    if ('BarcodeDetector' in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      detector.detect(canvas).then((barcodes: any[]) => {
        if (barcodes.length > 0 && !isProcessingRef.current) {
          isProcessingRef.current = true;
          handleQRResult(barcodes[0].rawValue);
        }
      }).catch(() => {});
    }
  };

  const handleQRResult = async (data: string) => {
    stopCamera();
    try {
      let parsed: any;
      try { parsed = JSON.parse(data); } catch { parsed = { activityId: data }; }

      const activityId = parsed.activityId || parsed.id || data;
      const activityName = parsed.activityName || parsed.name || activityId;

      // เช็คซ้ำ
      const dupQ = query(collection(db, 'checkins'), where('studentId', '==', studentId), where('activityId', '==', activityId));
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
        setStatus('duplicate');
        setMessage(`คุณเคยเช็คอินกิจกรรม "${activityName}" แล้ว`);
        isProcessingRef.current = false;
        return;
      }

      // ✅ NEW: แสดงฟอร์มประเมินก่อนบันทึก
      setScannedActivity({ id: activityId, name: activityName });
      setRating(0); setComment('');
      setStatus('evaluate');
      isProcessingRef.current = false;

    } catch (err) {
      console.error('QR Error:', err);
      setStatus('error'); setMessage('เกิดข้อผิดพลาดในการอ่าน QR Code');
      isProcessingRef.current = false;
    }
  };

  // ✅ NEW: บันทึกเช็คอิน + คะแนนประเมิน
  const handleSubmitEvaluation = async () => {
    if (rating === 0) { alert('กรุณาให้คะแนนความพึงพอใจ'); return; }
    if (!scannedActivity) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'checkins'), {
        studentId, studentName, activityId: scannedActivity.id,
        activityName: scannedActivity.name, timestamp: serverTimestamp(),
        checkinMethod: 'qr_scan', rating, comment: comment.trim()
      });
      setStatus('success');
      setMessage(`เช็คอินกิจกรรม "${scannedActivity.name}" สำเร็จ!`);
    } catch (err) {
      console.error('Save error:', err);
      setStatus('error'); setMessage('เกิดข้อผิดพลาดในการบันทึก');
    } finally { setSubmitting(false); }
  };

  const handleManualInput = () => {
    const code = prompt('กรุณากรอกรหัสกิจกรรม:');
    if (code?.trim()) handleQRResult(code.trim());
  };

  const resetScan = () => {
    setStatus('idle'); setMessage(''); setCameraError('');
    setScannedActivity(null); setRating(0); setComment('');
    isProcessingRef.current = false;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-800">
      {/* Header */}
      <div className="bg-[#1e553d] p-6 text-white flex items-center gap-4 shadow-lg">
        <button onClick={() => { stopCamera(); router.push('/student/dashboard'); }} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition">
          <ArrowLeft size={20}/>
        </button>
        <div><h1 className="text-xl font-bold">สแกน QR Code</h1><p className="text-green-100 text-xs opacity-80">บันทึกการเข้าร่วมกิจกรรม</p></div>
      </div>

      <div className="p-6 max-w-lg mx-auto">

        {/* === IDLE === */}
        {status === 'idle' && (
          <div className="text-center space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <div className="bg-[#1e553d] text-white w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg"><Camera size={40}/></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">พร้อมสแกน</h2>
              <p className="text-gray-400 text-sm mb-6">กดปุ่มด้านล่างเพื่อเปิดกล้องสแกน QR Code</p>
              <button onClick={startCamera} className="w-full bg-[#1e553d] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#16422f] transition shadow-lg active:scale-[0.98] flex items-center justify-center gap-3">
                <Camera size={24}/> เปิดกล้องสแกน
              </button>
              <button onClick={handleManualInput} className="mt-4 text-[#1e553d] text-sm font-medium hover:underline">กรอกรหัสกิจกรรมด้วยตัวเอง</button>
            </div>
            {cameraError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0"/>
                <div className="text-left">
                  <p className="text-red-700 text-sm font-medium">{cameraError}</p>
                  <button onClick={handleManualInput} className="text-red-600 text-xs mt-2 underline">กรอกรหัสด้วยตัวเองแทน</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === SCANNING === */}
        {status === 'scanning' && (
          <div className="space-y-4">
            <div className="bg-black rounded-[2rem] overflow-hidden relative shadow-xl">
              <video ref={videoRef} className="w-full aspect-square object-cover" playsInline muted />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-white/30 rounded-3xl relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#4ade80] rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#4ade80] rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#4ade80] rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#4ade80] rounded-br-xl" />
                </div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin"/> กำลังสแกน...
                </span>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden"/>
            <div className="flex gap-3">
              <button onClick={() => { stopCamera(); resetScan(); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition">ยกเลิก</button>
              <button onClick={() => { stopCamera(); handleManualInput(); }} className="flex-1 bg-[#1e553d] text-white py-3 rounded-2xl font-bold hover:bg-[#16422f] transition">กรอกรหัสเอง</button>
            </div>
          </div>
        )}

        {/* === EVALUATE (NEW!) === */}
        {status === 'evaluate' && scannedActivity && (
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 text-center">
            <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4">
              <CheckCircle size={36}/>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">สแกนสำเร็จ!</h2>
            <p className="text-gray-500 text-sm mb-6">กิจกรรม: <span className="font-semibold text-gray-700">{scannedActivity.name}</span></p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-left">
              <h3 className="font-bold text-gray-700 mb-4 text-center">ประเมินความพึงพอใจ</h3>

              <div className="flex justify-center mb-5">
                <StarRating rating={rating} onRate={setRating} size={36}/>
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-gray-500 mb-4">
                  {rating === 1 && 'ควรปรับปรุง'}
                  {rating === 2 && 'พอใช้'}
                  {rating === 3 && 'ปานกลาง'}
                  {rating === 4 && 'ดี'}
                  {rating === 5 && 'ดีมาก!'}
                </p>
              )}

              <label className="text-sm font-semibold text-gray-600 block mb-2">ความคิดเห็นเพิ่มเติม (ไม่บังคับ)</label>
              <textarea
                rows={3} placeholder="เขียนความคิดเห็นของคุณ..."
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-[#1e553d] focus:ring-1 focus:ring-[#1e553d] outline-none transition resize-none text-sm"
                value={comment} onChange={e => setComment(e.target.value)}
              />
            </div>

            <button onClick={handleSubmitEvaluation} disabled={submitting || rating === 0}
              className="w-full bg-[#1e553d] text-white py-4 rounded-2xl font-bold hover:bg-[#16422f] transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? <><Loader2 size={20} className="animate-spin"/> กำลังบันทึก...</> : <><Send size={20}/> ส่งประเมินและเช็คอิน</>}
            </button>
            <button onClick={resetScan} className="mt-3 text-gray-400 text-sm hover:text-gray-600">ยกเลิก</button>
          </div>
        )}

        {/* === SUCCESS === */}
        {status === 'success' && (
          <div className="text-center bg-white rounded-[2rem] p-8 shadow-sm border border-green-100">
            <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6"><CheckCircle size={48}/></div>
            <h2 className="text-xl font-bold text-green-700 mb-2">เช็คอินสำเร็จ!</h2>
            <p className="text-gray-500 text-sm mb-8">{message}</p>
            <button onClick={resetScan} className="w-full bg-[#1e553d] text-white py-4 rounded-2xl font-bold hover:bg-[#16422f] transition">สแกนกิจกรรมอื่น</button>
            <button onClick={() => router.push('/student/dashboard')} className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-200 transition">กลับหน้าหลัก</button>
          </div>
        )}

        {/* === DUPLICATE === */}
        {status === 'duplicate' && (
          <div className="text-center bg-white rounded-[2rem] p-8 shadow-sm border border-yellow-100">
            <div className="bg-yellow-100 text-yellow-600 w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6"><AlertTriangle size={48}/></div>
            <h2 className="text-xl font-bold text-yellow-700 mb-2">เช็คอินซ้ำ</h2>
            <p className="text-gray-500 text-sm mb-8">{message}</p>
            <button onClick={resetScan} className="w-full bg-[#1e553d] text-white py-4 rounded-2xl font-bold hover:bg-[#16422f] transition">สแกนกิจกรรมอื่น</button>
            <button onClick={() => router.push('/student/dashboard')} className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-200 transition">กลับหน้าหลัก</button>
          </div>
        )}

        {/* === ERROR === */}
        {status === 'error' && (
          <div className="text-center bg-white rounded-[2rem] p-8 shadow-sm border border-red-100">
            <div className="bg-red-100 text-red-600 w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6"><XCircle size={48}/></div>
            <h2 className="text-xl font-bold text-red-700 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-500 text-sm mb-8">{message}</p>
            <button onClick={resetScan} className="w-full bg-[#1e553d] text-white py-4 rounded-2xl font-bold hover:bg-[#16422f] transition">ลองใหม่อีกครั้ง</button>
            <button onClick={() => router.push('/student/dashboard')} className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-200 transition">กลับหน้าหลัก</button>
          </div>
        )}
      </div>
    </div>
  );
}
