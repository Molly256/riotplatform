"use client";
import { useState, useRef, useEffect } from "react";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  useEffect(() => {
    setPos({ x: window.innerWidth - 72, y: window.innerHeight - 200 });
  }, []);

  const onStart = (e) => {
    setDragging(true);
    hasMoved.current = false;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX - pos.x, y: clientY - pos.y };
  };

  const onMove = (e) => {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const newX = clientX - startPos.current.x;
    const newY = clientY - startPos.current.y;
    if (Math.abs(newX - pos.x) > 3 || Math.abs(newY - pos.y) > 3) {
      hasMoved.current = true;
    }
    // keep inside screen, above nav
    const clampedX = Math.max(8, Math.min(window.innerWidth - 64, newX));
    const clampedY = Math.max(8, Math.min(window.innerHeight - 140, newY));
    setPos({ x: clampedX, y: clampedY });
  };

  const onEnd = () => {
    setDragging(false);
    setTimeout(() => { hasMoved.current = false }, 100);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);
    } else {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [dragging, pos]);

  const handleClick = () => {
    if (hasMoved.current) return;
    setOpen(!open);
  };

  return (
    <>
      <button
        onMouseDown={onStart}
        onTouchStart={onStart}
        onClick={handleClick}
        style={{ left: pos.x, top: pos.y }}
        className={`fixed z-[9998] w-[56px] h-[56px] rounded-full bg-[#EBA043] shadow-xl flex items-center justify-center text-[28px] border-2 border-black select-none touch-none ${dragging ? 'scale-110 cursor-grabbing' : 'cursor-grab'}`}
      >
        🎧
      </button>

      {open && (
        <div className="fixed z-[9999] w-[300px] max-w-[90vw] max-h-[65vh] rounded-[20px] overflow-hidden shadow-2xl border-2 border-[#EBA043] bg-black
        bottom-[105px] right-4
        ">
          <div className="w-full bg-[#EBA043] px-4 py-3 flex items-center justify-between">
            <h3 className="font-black text-black text-[14px]">Support</h3>
            <button onClick={() => setOpen(false)} className="w-6 h-6 rounded-full bg-black text-[#EBA043] flex items-center justify-center text-xs font-bold">✕</button>
          </div>

          <div className="bg-[#141414] p-4 flex flex-col gap-3 overflow-y-auto">
            <div className="bg-[#1A1C24] rounded-xl p-3 border border-gray-800">
              <p className="text-[11px] font-bold text-[#EBA043] mb-2">✈️ Telegram Support</p>
              <a href="https://t.me/Riotplatfom" target="_blank" className="flex items-center gap-2 bg-[#229ED9] text-white px-3 py-2.5 rounded-lg font-bold text-[13px]">
                <span className="bg-white rounded-full w-6 h-6 flex items-center justify-center text-[#229ED9]">✈</span>
                @Riotplatfom
              </a>
            </div>

            <div className="bg-[#1A1C24] rounded-xl p-3 border border-gray-800">
              <p className="text-[11px] font-bold text-[#EBA043] mb-2">💬 WhatsApp Support</p>
              <div className="flex flex-col gap-2">
                <a href="https://wa.me/447520643574" target="_blank" className="flex items-center gap-2 bg-[#25D366] text-white px-3 py-2.5 rounded-lg font-bold text-[13px]">
                  🟢 +447520643574
                </a>
                <a href="https://wa.me/447520643712" target="_blank" className="flex items-center gap-2 bg-[#25D366] text-white px-3 py-2.5 rounded-lg font-bold text-[13px]">
                  🟢 +447520643712
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}