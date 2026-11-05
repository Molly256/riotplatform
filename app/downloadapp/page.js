'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DownloadApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(function() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(()=>{})
    }
    function handler(e) {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return function() {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  function triggerToast(msg) {
    setToastMsg(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 4000)
  }

  async function onTapInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        setDeferredPrompt(null)
        triggerToast('✅ App installed!')
      }
    } else {
      const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
      if (isIOS) {
        triggerToast('📲 Tap Share ⬆️ → Add to Home Screen')
      } else {
        triggerToast('📲 Tap browser menu ⋮ → Install app')
      }
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="w-full bg-[#EBA043] px-5 py-[14px] flex items-center gap-3 sticky top-0 z-50">
        <Link href="/dashboard" className="text-black text-[22px] font-black no-underline">←</Link>
        <h1 className="text-black font-black text-[18px] m-0">DownloadApp</h1>
      </div>

      {showToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[#EBA043] text-black px-5 py-3.5 rounded-xl font-black text-[13px] z-[9999] shadow-[0_8px_24px_rgba(235,160,67,0.4)] w-[90%] max-w-[360px] text-center animate-[slideDown_0.3s_ease]">
          {toastMsg}
        </div>
      )}

      <div className="p-10 flex flex-col items-center mt-8">
        <h1 className="text-[#EBA043] font-extrabold text-[28px] mb-8">DownloadApp</h1>
        
        <button
          onClick={onTapInstall}
          className="w-full max-w-[360px] py-4 bg-[#EBA043] text-black border-0 rounded-xl text-[16px] font-black cursor-pointer hover:bg-[#D18A32] active:scale-[0.98] transition"
        >
          Download Riotplatform app
        </button>

        {/* Instructions - below Download button */}
        <div className="w-full max-w-[360px] mt-10">
          <p className="text-[#EBA043] font-black text-[16px] mb-3">📲 How to Install the App</p>

          <div className="flex flex-col gap-3 text-[13px] font-bold leading-6">
            <div className="bg-[#12131A] border border-[#2A2C35] rounded-[12px] p-3">
              <p className="text-white">🤖 For Android - Chrome</p>
              <p className="text-[#8A8D98] mt-1">👆 Tap the <span className="text-white">Download Riotplatform app</span> button above, then tap <span className="text-white">Install</span> when the popup appears.</p>
              <p className="text-[#8A8D98]">⋮ If no popup shows, tap the browser menu <span className="text-white">⋮</span> on top right → tap <span className="text-white">Install app</span> or <span className="text-white">Add to Home screen</span>.</p>
            </div>

            <div className="bg-[#12131A] border border-[#2A2C35] rounded-[12px] p-3">
              <p className="text-white">🍎 For iPhone - Safari</p>
              <p className="text-[#8A8D98] mt-1">📤 Tap the <span className="text-white">Share</span> button at the bottom of Safari.</p>
              <p className="text-[#8A8D98]">➕ Scroll down and tap <span className="text-white">Add to Home Screen</span>, then tap <span className="text-white">Add</span> on top right.</p>
            </div>

            <div className="bg-[#12131A] border border-[#2A2C35] rounded-[12px] p-3">
              <p className="text-white">🏠 After Installing</p>
              <p className="text-[#8A8D98] mt-1">📱 You will see the Riotplatform icon on your home screen like a normal app.</p>
              <p className="text-[#8A8D98]">✅ Tap it to open the app fast, without opening the browser every time.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </main>
  )
}