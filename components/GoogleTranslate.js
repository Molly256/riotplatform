"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GoogleTranslate() {
  const pathname = usePathname();

  useEffect(() => {
    if (document.querySelector("#google-translate-script")) {
      document.body.style.top = "0px";
      return;
    }

    // Inject CSS BEFORE script loads
    const style = document.createElement("style");
    style.id = "gt-hide-style";
    style.innerHTML = `
      iframe.goog-te-banner-frame, .goog-te-banner-frame.skiptranslate, .goog-te-banner-frame {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        width: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      body { top: 0 !important; margin-top: 0 !important; position: static !important; }
      html { margin-top: 0 !important; }
      #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
      .goog-te-ftab-float, .VIpgJd-ZVi9od-l4eHX-hSRGPd, .goog-logo-link { display: none !important; }
      #google_translate_element, .goog-te-gadget { display: none !important; }
      .goog-text-highlight { background: transparent !important; box-shadow: none !important; }
    `;
    document.documentElement.appendChild(style);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: "en,sw,zh-CN,lg,fr,ar,es", autoDisplay: false },
        "google_translate_element"
      );
      // Immediate hide after init
      setTimeout(() => { document.body.style.top = "0px"; }, 100);
    };

    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(s);

    // Aggressive observer - kills banner every 100ms
    const killBanner = () => {
      document.body.style.top = "0px !important";
      document.documentElement.style.marginTop = "0px";
      const banner = document.querySelector("iframe.goog-te-banner-frame");
      if (banner) {
        banner.style.display = "none";
        banner.remove();
      }
      const skiptranslate = document.querySelector(".skiptranslate");
      if (skiptranslate && skiptranslate.tagName === "IFRAME") {
        skiptranslate.style.display = "none";
      }
    };

    const interval = setInterval(killBanner, 100);
    setTimeout(() => clearInterval(interval), 5000);

    const observer = new MutationObserver(killBanner);
    observer.observe(document.documentElement, { childList: true, subtree: true });

  }, []);

  useEffect(() => {
    const appLang = localStorage.getItem("app_language") || "en";
    if (appLang === "en") return;
    const val = "/en/" + appLang;
    document.cookie = "googtrans=" + val + "; path=/;";
    let count = 0;
    const iv = setInterval(() => {
      count++;
      const sel = document.querySelector(".goog-te-combo");
      if (sel) {
        sel.value = appLang;
        sel.dispatchEvent(new Event("change"));
        document.body.style.top = "0px";
        clearInterval(iv);
      }
      if (count > 25) clearInterval(iv);
    }, 300);
  }, [pathname]);

  return <div id="google_translate_element" style={{display:"none", height:0, width:0, overflow:"hidden"}}></div>;
}