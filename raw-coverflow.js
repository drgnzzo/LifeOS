/* RAW Entry — Cover Flow Nivel 1 v.7.083 (ROLLBACK + WIP)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ FASE v7.083 — STUB SEGURO (intento 3 revertido)                  ║
   ╚══════════════════════════════════════════════════════════════════╝
   El v7.082 trabó la app: el MutationObserver sobre <html> + el
   hook a _reposicionarHUD + el listener delegado en click se
   amplificaron entre sí y bloquearon el main thread.
   Vuelvo al stub limpio (igual que v7.069): este archivo NO hace
   nada visible — solo limpia rastros de intentos anteriores por
   si quedó algo cacheado. El Cover Flow infinito se está
   rediseñando con el modelo correcto (carrusel circular, todas
   las cards en bucle, navegación horizontal sin sentido fijo).
*/
(function(){
  'use strict';
  try {
    document.documentElement.classList.remove('coverflow-on');
    var stale = document.querySelectorAll(
      '.cf-lateral,.cf-l1,.cf-l2,.cf-r1,.cf-r2,[data-cf]'
    );
    stale.forEach(function(el){
      el.classList.remove('cf-lateral','cf-l1','cf-l2','cf-r1','cf-r2');
      el.removeAttribute('data-cf');
      ['--cf-tx','--cf-rotY','--cf-scale','--cf-op','--cf-blur','--cf-z']
        .forEach(function(v){ el.style.removeProperty(v); });
    });
    var staleCSS = document.getElementById('coverflow-css');
    if(staleCSS && staleCSS.parentNode) staleCSS.parentNode.removeChild(staleCSS);
    var staleArrows = document.querySelector('.cf-arrows');
    if(staleArrows && staleArrows.parentNode) staleArrows.parentNode.removeChild(staleArrows);
    // Limpiar API si quedó del intento anterior
    try { delete window._coverflow; } catch(e){ window._coverflow = undefined; }
  } catch(e){}
})();
