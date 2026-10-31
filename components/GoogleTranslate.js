"use client";
import { useEffect } from "react";

export default function GoogleTranslate() {
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

    const saved = localStorage.getItem("googtrans");
    if (saved) document.cookie = `googtrans=${saved}; path=/;`;

    const obs = new MutationObserver(() => { document.body.style.top = "0px"; });
    obs.observe(document.body, { childList: true, subtree: true });
  }, []);

  return <div id="google_translate_element" style={{display:"none"}}></div>;
}