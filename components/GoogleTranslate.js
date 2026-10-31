"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GoogleTranslate() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.googleTranslateLoaded) return;
    window.googleTranslateLoaded = true;

    const addStyle = () => {
      if (document.getElementById("gt-style")) return;
      const style = document.createElement("style");
      style.id = "gt-style";
      style.innerHTML = `
        .goog-te-banner-frame.skiptranslate { display: none !important; }
        body { top: 0px !important; }
        .goog-te-gadget { display: none !important; }
        #google_translate_element { display: none !important; }
        .goog-te-balloon-frame { display: none !important; }
        .goog-text-highlight { background: transparent !important; box-shadow: none !important; }
      `;
      document.head.appendChild(style);
    };
    addStyle();

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
  }, []);

  useEffect(() => {
    const lang = localStorage.getItem("app_language") || "en";
    
    // Hide banner every time pathname changes
    const hideBanner = () => {
      document.body.style.top = "0px";
      const banner = document.querySelector(".goog-te-banner-frame");
      if (banner) banner.style.display = "none";
    };
    
    const interval = setInterval(hideBanner, 500);
    setTimeout(() => clearInterval(interval), 3000);

    if (lang === "en") return;
    
    const val = "/en/" + lang;
    document.cookie = "googtrans=" + val + "; path=/;";

    let tries = 0;
    const iv = setInterval(() => {
      tries++;
      const combo = document.querySelector(".goog-te-combo");
      if (combo) {
        if (combo.value !== lang) {
          combo.value = lang;
          combo.dispatchEvent(new Event("change"));
        }
        document.body.style.top = "0px";
        clearInterval(iv);
      }
      if (tries > 30) clearInterval(iv);
    }, 500);

    return () => clearInterval(iv);
  }, [pathname]);

  return <div id="google_translate_element"></div>;
}