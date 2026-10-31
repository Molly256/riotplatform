'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function GoogleTranslate({ children }) {
  const pathname = usePathname();

  useEffect(()=>{
    if(!document.querySelector('#google-translate-script')){
      const s = document.createElement('script')
      s.id = 'google-translate-script'
      s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      document.body.appendChild(s)
    }

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', autoDisplay: false },
        'google_translate_element'
      )
      const saved = localStorage.getItem('app_language')
      if(saved && saved !== 'en'){
        setTimeout(()=>{
          const sel = document.querySelector('.goog-te-combo')
          if(sel){
            sel.value = saved
            sel.dispatchEvent(new Event('change'))
          }
        },800)
      }
    }

    if (document.querySelector('#gt-hide-style')) return;
    const style = document.createElement('style')
    style.id = 'gt-hide-style'
    style.innerHTML = `
      .goog-te-banner-frame{display:none!important}
      body{top:0!important}
      #google_translate_element{display:none!important}
      .goog-te-gadget-icon{display:none!important}
      .goog-te-gadget{display:none!important}
      #goog-gt-tt, .goog-te-balloon-frame{display:none!important}
      .goog-text-highlight{background:transparent!important; box-shadow:none!important}
    `
    document.head.appendChild(style)
  },[])

  useEffect(() => {
    const saved = localStorage.getItem('app_language');
    if(!saved || saved === 'en') return;
    let t=0;
    const iv = setInterval(() => {
      t++;
      const sel = document.querySelector('.goog-te-combo');
      if(sel){
        sel.value = saved;
        sel.dispatchEvent(new Event('change'));
        clearInterval(iv);
      }
      if(t>20) clearInterval(iv);
    }, 500);
  }, [pathname]);

  return (
    <>
      <div id="google_translate_element" style={{display:'none'}}></div>
      {children}
    </>
  )
}