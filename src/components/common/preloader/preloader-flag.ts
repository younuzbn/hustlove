import { BOT_UA } from "@/utils/bot-ua";

/**
 * Runs before the page is parsed (first child of <body>, like the consent
 * flag), so it fires on every full page load or refresh — not on client-side
 * navigation between pages. For people only — not for robots, not under
 * reduced motion — it marks `<html data-preloader>`, which shows the
 * server-rendered cover (`PreloaderCover`) before the first paint. React takes
 * the cover over once hydrated (`Preloader`); if it never does, a timer lifts
 * it. The page itself is rendered underneath and never waits.
 *
 * No "use client": the server layout imports the string itself.
 */
export const PRELOADER_FLAG_SCRIPT = `try{var d=document.documentElement;if(!${BOT_UA.toString()}.test(navigator.userAgent)&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-preloader","");window.__preloaderTimer=setTimeout(function(){d.removeAttribute("data-preloader")},5000)}}catch(e){}`;
