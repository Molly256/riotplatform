"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GoogleTranslate() {
  const pathname = usePathname();

  useEffect(() => {
    if (document.querySelector("#google-translate-script")) return;

    // 1. CSS that kills everything before it appears
    const css = `
      .goog-te-banner-frame.skiptranslate, iframe.goog-te-banner-frame, .goog-te-banner-frame { display:none !important; }
      body > .skiptranslate { display:none !important; }
      body { top:0 !important; }
      #goog-gt-tt, .goog-te-balloon-frame, .VIpgJd-ZVi9od-l4eHX-hSRGPd, .goog-te-ftab-float { display:none !important; }
      #google_translate_element { display:none !important; }
      .goog-text-highlight { background:transparent !important; box-shadow:none !important; }
    `;
    const style = document.createElement("style");
    style.innerHTML = css;
    document.head.appendChild(style);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: "en,sw,zh-CN,lg,fr,ar,es", autoDisplay: false },
        "google_translate_element"
      );
    };

    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(s);

    // 2. HARD KILL - remove any div that contains translate.google.com link
    const kill = () => {
      document.body.style.top = "0px";
      // Kill the banner iframe
      document.querySelectorAll("iframe.goog-te-banner-frame, .goog-te-banner-frame").forEach(el => el.remove());
      // Kill the skiptranslate div at top of body (this is the one showing the link)
      document.querySelectorAll("body > div.skiptranslate").forEach(el => {
        if (el.id !== "google_translate_element") el.remove();
      });
    };

    // Run every 50ms for 10 seconds
    const iv = setInterval(kill, 50);
    setTimeout(() => clearInterval(iv), 10000);
    
    const obs = new MutationObserver(kill);
    obs.observe(document.body, { childList: true, subtree: false });
  }, []);

  useEffect(() => {
    const lang = localStorage.getItem("app_language") || "en";
    if (lang === "en") return;
    const val = "/en/" + lang;
    document.cookie = "googtrans=" + val + "; path=/;";
    let n = 0;
    const iv = setInterval(() => {
      n++;
      const sel = document.querySelector(".goog-te-combo");
      if (sel) {
        sel.value = lang;
        sel.dispatchEvent(new Event("change"));
        document.body.style.top = "0px";
        clearInterval(iv);
      }
      if (n > 20) clearInterval(iv);
    }, 300);
  }, [pathname]);

  return <div id="google_translate_element" style={{display:"none"}}></div>;
}