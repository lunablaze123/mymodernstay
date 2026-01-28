import { getJSON, applyTheme, mountNav, mountFooter, mountFadeIns } from "../app.js";
(async ()=>{applyTheme(await getJSON("content/settings/theme.json")); await mountNav("admin.html"); await mountFooter(); mountFadeIns();})();
