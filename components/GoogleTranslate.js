"use client";
import { useEffect } from "react";

export default function GoogleTranslate() {
  useEffect(() => {
    if (document.querySelector("#google-translate-script")) return;

    // Hide Google banner and widget
    const style = document.createElement("style");
    style.innerHTML = `
      .goog-te-banner-frame { display:none !important; }
      .goog-te-gadget { font-size:0 !important; }
      .goog-te-gadget span { display:none !important; }
      #google_translate_element { display:none !important; }
      body { top:0 !important; position: static !important; }
      .VIpgJd-ZVi9od-l4eHX-hSRGPd { display:none !important; }
      .goog-logo-link { display:none !important; }
      .goog-te-combo { display:none !important; }
    `;
    document.head.appendChild(style);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,sw,zh-CN,lg,fr,ar,es",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);

    // Restore saved language on load
    const saved = localStorage.getItem("googtrans");
    if (saved) {
      document.cookie = `googtrans=${saved}; path=/;`;
    }
  }, []);

  return <div id="google_translate_element" style={{ display: "none" }}></div>;
}