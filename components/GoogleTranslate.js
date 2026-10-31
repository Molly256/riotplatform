"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GoogleTranslate() {
  const pathname = usePathname();

  useEffect(() => {
    if (document.querySelector("#google-translate-script")) return;

    const style = document.createElement("style");
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate, .goog-te-banner-frame, .goog-te-ftab-float,
      #goog-gt-tt, .goog-te-balloon-frame, .VIpgJd-ZVi9od-l4eHX-hSRGPd { display:none !important; }
      body { top:0 !important; position:static !important; }
      .goog-text-highlight { background:transparent !important; box-shadow:none !important; }
      .goog-logo-link, .goog-te-gadget { display:none !important; }
      #google_translate_element { display:none !important; }
    `;
    document.head.appendChild(style);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { 
          pageLanguage: "en", 
          includedLanguages: "en,sw,zh-CN,lg,fr,ar,es", 
          autoDisplay: false 
        },
        "google_translate_element"
      );
    };

    const s = document.createElement("script");
    s.id = "google-translate-script";
    s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    const appLang = localStorage.getItem("app_language") || "en";
    if (appLang === "en") return;

    const googtransVal = "/en/" + appLang;
    document.cookie = "googtrans=" + googtransVal + "; path=/;";

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        select.value = appLang;
        select.dispatchEvent(new Event("change"));
        clearInterval(interval);
      }
      if (attempts > 20) clearInterval(interval);
    }, 400);

    return () => clearInterval(interval);
  }, [pathname]);

  return <div id="google_translate_element"></div>;
}