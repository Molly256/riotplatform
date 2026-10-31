"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GoogleTranslate() {
  const pathname = usePathname();

  useEffect(() => {
    if (document.querySelector("#google-translate-script")) return;

    const style = document.createElement("style");
    style.id = "google-translate-style";
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate { display: none !important; visibility: hidden !important; }
      .goog-te-banner-frame { display: none !important; }
      body { top: 0px !important; }
      #goog-gt-tt, .goog-te-balloon-frame, .goog-te-ftab-float, .VIpgJd-ZVi9od-l4eHX-hSRGPd { display: none !important; }
      .goog-logo-link, .goog-te-gadget { display: none !important; }
      #google_translate_element { display: none !important; }
      .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
      font { background-color: transparent !important; box-shadow: none !important; }
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

    // Force hide banner constantly
    const observer = new MutationObserver(() => {
      document.body.style.top = "0px";
      const banner = document.querySelector(".goog-te-banner-frame");
      if (banner) banner.style.display = "none";
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
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
        document.body.style.top = "0px";
      }
      if (attempts > 20) clearInterval(interval);
    }, 400);

    return () => clearInterval(interval);
  }, [pathname]);

  return <div id="google_translate_element" style={{display:"none"}}></div>;
}