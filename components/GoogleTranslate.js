"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GoogleTranslate() {
  const pathname = usePathname();

  // 1. Initial load
  useEffect(() => {
    if (document.querySelector("#google-translate-script")) return;

    const style = document.createElement("style");
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate, .goog-te-banner-frame, .goog-te-ftab-float,
      #goog-gt-tt, .goog-te-balloon-frame, .VIpgJd-ZVi9od-l4eHX-hSRGPd, .VIpgJd-ZVi9od-ORb3N,
      .goog-logo-link, .goog-te-gadget, #google_translate_element { display:none !important; }
      body { top:0 !important; position:static !important; }
      .goog-text-highlight { background:transparent !important; box-shadow:none !important; }
    `;
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

    // Restore saved language
    const saved = localStorage.getItem("googtrans");
    if (saved) {
      document.cookie = `googtrans=${saved}; path=/;`;
      document.cookie = `googtrans=${saved}; path=/; domain=.${window.location.hostname};`;
    }

    const obs = new MutationObserver(() => { document.body.style.top = "0px"; });
    obs.observe(document.body, { childList: true, subtree: true });
  }, []);

  // 2. FIX: Re-translate on every page change (This is why only 1 page was changing)
  useEffect(() => {
    const saved = localStorage.getItem("googtrans");
    if (!saved || saved === "/en/en") return;

    // Re-apply cookie
    document.cookie = `googtrans=${saved}; path=/;`;

    // Force Google to re-translate new page DOM
    const interval = setInterval(() => {
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        select.value = saved.split("/").pop(); // e.g. "fr"
        select.dispatchEvent(new Event("change"));
        clearInterval(interval);
      }
    }, 300);

    const timeout = setTimeout(() => clearInterval(interval), 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname]);

  return <div id="google_translate_element" style={{ display: "none" }}></div>;
}