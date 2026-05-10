/* RAW Entry — Overlay Drag & Drop v.5.086

   Drag-and-drop específico para el OVERLAY DEL DIAL — completamente
   independiente de raw-drag.js (que maneja el reordenamiento del board HOME).

   Funcionalidad:
   - Cada panel del overlay (excepto USER, Sim, Stats, Track) tiene un handle
     en su header con icono fa-grip-vertical para arrastrarlo.
   - Reordenamiento dentro de su zona (left, right, bottom-*). Los paneles top
     (USER, Estado del Sim, Stats) NO se reordenan — son únicos.
   - Slots vacíos PUNTEADOS siempre visibles (configurable en SLOTS_CONFIG).
   - Persistencia en localStorage: 'lifeos_overlay_layout_v1'.
   - Drop indicator (línea horizontal con glow) durante drag.

   ORDEN DE CARGA: después de raw-overlay.js. */

(function(){
  var STORAGE_KEY = 'lifeos_overlay_layout_v1';

  // Slots vacíos por zona. Si bajas la cantidad, no aparecen ghosts.
  var SLOTS_CONFIG = {
    left:   4,   // 3 paneles actuales + 1 slot vacío extra
    right:  4,   // 3 paneles actuales + 1 slot vacío extra
    bottom: 3,   // 3 cards (sin ghosts por defecto)
  };

  var _state = {
    initialized: false,
    dragEl: null,
    dragSide: null,
    dragOrder: null,
  };
  var _ghostSlots = [];
  var _dropIndicator = null;

  // ═══ CSS ═══
  function injectCSS(){
    if(document.getElementById('hud-dnd-css')) return;
    var s = document.createElement('style');
    s.id = 'hud-dnd-css';
    s.textContent = [
      '.hud-dnd-handle{display:inline-flex;align-items:center;justify-content:center;'+
        'width:18px;height:18px;border-radius:4px;cursor:grab;opacity:.45;'+
        'transition:opacity .15s,background .15s;flex-shrink:0;margin-right:4px}',
      '.hud-dnd-handle:hover{opacity:.95;background:rgba(255,255,255,0.06)}',
      '.hud-dnd-handle:active{cursor:grabbing;opacity:1}',
      '.hud-dnd-handle i{font-size:10px;color:rgba(220,224,235,0.55)}',
      '.hud-dragging{opacity:.35;cursor:grabbing!important;z-index:9100!important}',
      '.hud-dragging *{pointer-events:none}',
      '.hud-empty-slot{position:fixed;z-index:8995;border-radius:14px;'+
        'border:2px dashed rgba(167,139,250,0.22);background:rgba(167,139,250,0.025);'+
        'display:flex;align-items:center;justify-content:center;'+
        'opacity:0;transition:opacity .35s ease,border-color .2s,background .2s;'+
        'pointer-events:none}',
      '.hud-empty-slot.visible{opacity:1;pointer-events:auto}',
      '.hud-empty-slot.drop-target{border-color:rgba(167,139,250,0.65);'+
        'background:rgba(167,139,250,0.10);'+
        'box-shadow:0 0 24px rgba(167,139,250,0.25),inset 0 0 16px rgba(167,139,250,0.12)}',
      '.hud-empty-slot-inner{display:flex;flex-direction:column;align-items:center;'+
        'gap:6px;color:rgba(167,139,250,0.45);text-align:center}',
      '.hud-empty-slot-inner i{font-size:18px}',
      '.hud-empty-slot-inner span{font-size:9px;font-weight:800;letter-spacing:.14em;'+
        'text-transform:uppercase}',
      '.hud-drop-indicator{position:fixed;z-index:9050;height:3px;'+
        'background:linear-gradient(90deg,transparent,#A78BFA,transparent);'+
        'box-shadow:0 0 12px rgba(167,139,250,0.7),0 0 24px rgba(167,139,250,0.4);'+
        'border-radius:2px;pointer-events:none}',
    ].join('\n');
    document.head.appendChild(s);
  }

  // ═══ Persistencia ═══
  function loadLayout(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    } catch(e){ return null; }
  }
  function saveLayout(){
    if(!window._hudPanels) return;
    var layout = { left:[], right:[], bottom:[] };
    window._hudPanels.forEach(function(hp){
      var side = hp.el._side;
      if(side === 'left' || side === 'right' ||
         side === 'bottom-left' || side === 'bottom-center' || side === 'bottom-right'){
        var key = side.indexOf('bottom-') === 0 ? 'bottom' : side;
        layout[key].push({ id: hp.el.id, side: side, order: hp.el._order });
      }
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); } catch(e){}
  }
  function restoreLayout(){
    var saved = loadLayout();
    if(!saved || !window._hudPanels) return;
    var byId = {};
    window._hudPanels.forEach(function(hp){ byId[hp.el.id] = hp; });
    ['left','right','bottom'].forEach(function(zone){
      var entries = saved[zone];
      if(!Array.isArray(entries)) return;
      entries.forEach(function(entry, idx){
        var hp = byId[entry.id];
        if(!hp) return;
        if(entry.side) hp.el._side = entry.side;
        hp.el._order = idx;
      });
    });
  }

  // ═══ Slots vacíos ═══
  function clearGhostSlots(){
    _ghostSlots.forEach(function(s){ if(s.parentNode) s.parentNode.removeChild(s); });
    _ghostSlots = [];
  }

  function buildGhostSlots(){
    clearGhostSlots();
    if(!window._hudPanels) return;
    if(!window._dialVisible && !document.getElementById('dial-overlay')) return;

    function lastPanelInfo(side){
      var ps = window._hudPanels.filter(function(hp){ return hp.el._side === side; });
      if(!ps.length) return null;
      ps.sort(function(a,b){ return a.el._order - b.el._order; });
      var last = ps[ps.length-1].el;
      var rect = last.getBoundingClientRect();
      return { rect: rect, count: ps.length, lastEl: last };
    }

    // Slots laterales (left, right): aparecen DEBAJO del último panel
    ['left','right'].forEach(function(side){
      var info = lastPanelInfo(side);
      if(!info) return;
      var needed = SLOTS_CONFIG[side] - info.count;
      if(needed <= 0) return;
      var slotH = 110;
      var gap   = 14;
      var w     = info.rect.width;
      var x     = info.rect.left;
      var y     = info.rect.bottom + gap;
      // Verificar que no invada el track
      var trackEl = document.getElementById('hud-track');
      var maxBottom = trackEl ? (trackEl.getBoundingClientRect().top - gap) : (window.innerHeight - 40);
      for(var i=0; i<needed; i++){
        if(y + slotH > maxBottom) break;
        var slot = document.createElement('div');
        slot.className = 'hud-empty-slot';
        slot.dataset.side = side;
        slot.dataset.slotIndex = String(info.count + i);
        slot.style.left   = x + 'px';
        slot.style.top    = y + 'px';
        slot.style.width  = w + 'px';
        slot.style.height = slotH + 'px';
        slot.innerHTML = '<div class="hud-empty-slot-inner">'+
          '<i class="fas fa-circle-plus"></i>'+
          '<span>Slot vacío</span>'+
        '</div>';
        document.body.appendChild(slot);
        _ghostSlots.push(slot);
        y += slotH + gap;
        // Activar transición
        (function(s){ requestAnimationFrame(function(){ s.classList.add('visible'); }); })(slot);
      }
    });
  }

  // ═══ Drop indicator ═══
  function showDropIndicator(y, x, w){
    if(!_dropIndicator){
      _dropIndicator = document.createElement('div');
      _dropIndicator.className = 'hud-drop-indicator';
      document.body.appendChild(_dropIndicator);
    }
    _dropIndicator.style.left  = x + 'px';
    _dropIndicator.style.top   = y + 'px';
    _dropIndicator.style.width = w + 'px';
    _dropIndicator.style.display = 'block';
  }
  function hideDropIndicator(){
    if(_dropIndicator) _dropIndicator.style.display = 'none';
  }

  // ═══ Lógica de reorder ═══
  function findDropTarget(side, mouseY){
    var ps = window._hudPanels.filter(function(hp){
      return hp.el._side === side && hp.el !== _state.dragEl;
    });
    ps.sort(function(a,b){ return a.el._order - b.el._order; });
    for(var i=0; i<ps.length; i++){
      var rect = ps[i].el.getBoundingClientRect();
      var mid  = rect.top + rect.height/2;
      if(mouseY < mid) return { insertAt: i, ref: ps[i] };
    }
    return { insertAt: ps.length, ref: ps[ps.length-1] || null };
  }

  function applyReorder(side, dragEl, insertAt){
    var dragHp = window._hudPanels.find(function(hp){ return hp.el === dragEl; });
    if(!dragHp) return;
    var ps = window._hudPanels.filter(function(hp){
      return hp.el._side === side && hp.el !== dragEl;
    });
    ps.sort(function(a,b){ return a.el._order - b.el._order; });
    ps.splice(insertAt, 0, dragHp);
    ps.forEach(function(hp, idx){ hp.el._order = idx; });
  }

  function moveToSlot(dragEl, slotEl){
    var newSide = slotEl.dataset.side;
    var dragHp = window._hudPanels.find(function(hp){ return hp.el === dragEl; });
    if(!dragHp) return;
    var oldSide = dragHp.el._side;
    if(oldSide === newSide) return;
    dragHp.el._side = newSide;
    var newSideCount = window._hudPanels.filter(function(hp){
      return hp.el._side === newSide;
    }).length;
    dragHp.el._order = newSideCount - 1; // queda al final
    var oldZone = window._hudPanels.filter(function(hp){ return hp.el._side === oldSide; });
    oldZone.sort(function(a,b){ return a.el._order - b.el._order; });
    oldZone.forEach(function(hp, idx){ hp.el._order = idx; });
  }

  // ═══ Hacer un panel arrastrable ═══
  function makeDraggable(panelEl){
    if(panelEl._dndDraggable) return;
    var side = panelEl._side;
    var allowedSides = ['left','right','bottom-left','bottom-center','bottom-right'];
    if(allowedSides.indexOf(side) === -1) return;

    var header = panelEl.querySelector('.hud-h') || panelEl.querySelector('.hud-card');
    if(!header) return;
    if(header.querySelector('.hud-dnd-handle')) return;

    var handle = document.createElement('div');
    handle.className = 'hud-dnd-handle';
    handle.title = 'Arrastrar';
    handle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
    header.insertBefore(handle, header.firstChild);

    handle.addEventListener('mousedown', function(e){
      e.stopPropagation();
      e.preventDefault();
      startDrag(panelEl, e);
    });

    panelEl._dndDraggable = true;
  }

  // ═══ Drag con mouse ═══
  function startDrag(panelEl, downEvt){
    if(_state.dragEl) return;
    _state.dragEl    = panelEl;
    _state.dragSide  = panelEl._side;
    _state.dragOrder = panelEl._order;

    panelEl.classList.add('hud-dragging');
    document.body.style.cursor = 'grabbing';
    buildGhostSlots();

    var startX = downEvt.clientX;
    var startY = downEvt.clientY;

    function onMove(e){
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      panelEl.style.transform = 'translate('+dx+'px,'+dy+'px)';

      _ghostSlots.forEach(function(s){ s.classList.remove('drop-target'); });
      var hover = detectZoneAt(e.clientX, e.clientY);
      if(hover && hover.type === 'slot'){
        hover.el.classList.add('drop-target');
        hideDropIndicator();
      } else if(hover && hover.type === 'panel'){
        var target = findDropTarget(hover.side, e.clientY);
        if(target.ref){
          var rect = target.ref.el.getBoundingClientRect();
          var midY = rect.top + rect.height/2;
          var lineY = (e.clientY < midY) ? rect.top - 6 : rect.bottom + 3;
          showDropIndicator(lineY, rect.left, rect.width);
        } else {
          hideDropIndicator();
        }
      } else {
        hideDropIndicator();
      }
    }

    function onUp(e){
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      panelEl.classList.remove('hud-dragging');
      panelEl.style.transform = '';
      document.body.style.cursor = '';
      hideDropIndicator();

      var hover = detectZoneAt(e.clientX, e.clientY);
      if(hover){
        if(hover.type === 'slot'){
          moveToSlot(panelEl, hover.el);
        } else if(hover.type === 'panel'){
          // Si zona destino distinta, cambiar side primero
          if(hover.side !== panelEl._side){
            var dragHp = window._hudPanels.find(function(hp){ return hp.el === panelEl; });
            if(dragHp){
              var oldSide = dragHp.el._side;
              dragHp.el._side = hover.side;
              var oldZone = window._hudPanels.filter(function(hp){ return hp.el._side === oldSide; });
              oldZone.sort(function(a,b){ return a.el._order - b.el._order; });
              oldZone.forEach(function(hp, idx){ hp.el._order = idx; });
            }
          }
          var target = findDropTarget(hover.side, e.clientY);
          applyReorder(hover.side, panelEl, target.insertAt);
        }
      }
      clearGhostSlots();
      if(typeof window._reposicionarHUD === 'function') window._reposicionarHUD();
      saveLayout();
      requestAnimationFrame(function(){ buildGhostSlots(); });

      _state.dragEl = null;
      _state.dragSide = null;
      _state.dragOrder = null;
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function detectZoneAt(x, y){
    // 1. Slot vacío
    for(var i=0; i<_ghostSlots.length; i++){
      var slot = _ghostSlots[i];
      var rect = slot.getBoundingClientRect();
      if(x>=rect.left && x<=rect.right && y>=rect.top && y<=rect.bottom){
        return { type:'slot', el:slot };
      }
    }
    // 2. Panel
    if(!window._hudPanels) return null;
    var allowedSides = ['left','right','bottom-left','bottom-center','bottom-right'];
    for(var j=0; j<window._hudPanels.length; j++){
      var hp = window._hudPanels[j];
      if(hp.el === _state.dragEl) continue;
      if(allowedSides.indexOf(hp.el._side) === -1) continue;
      var pr = hp.el.getBoundingClientRect();
      if(x>=pr.left && x<=pr.right && y>=pr.top && y<=pr.bottom){
        return { type:'panel', el:hp.el, side:hp.el._side };
      }
    }
    return null;
  }

  // ═══ Init ═══
  function init(){
    if(_state.initialized) return;
    if(window.innerWidth < 900) return;
    if(!window._hudPanels) return;

    injectCSS();
    restoreLayout();
    window._hudPanels.forEach(function(hp){ makeDraggable(hp.el); });
    if(typeof window._reposicionarHUD === 'function') window._reposicionarHUD();
    requestAnimationFrame(function(){
      requestAnimationFrame(buildGhostSlots);
    });

    var resizeT;
    window.addEventListener('resize', function(){
      clearTimeout(resizeT);
      resizeT = setTimeout(function(){
        if(typeof window._reposicionarHUD === 'function') window._reposicionarHUD();
        buildGhostSlots();
      }, 250);
    });

    _state.initialized = true;
  }

  // Polling: esperar a que el overlay esté montado
  var pollT = setInterval(function(){
    if(window._hudPanels && window._reposicionarHUD){
      clearInterval(pollT);
      requestAnimationFrame(function(){
        requestAnimationFrame(init);
      });
    }
  }, 200);

  // Hook abrirDial: rebuild slots cuando se abre
  var origAbrir = null;
  var hookT = setInterval(function(){
    if(typeof window.abrirDial !== 'function') return;
    if(origAbrir){ clearInterval(hookT); return; }
    origAbrir = window.abrirDial;
    window.abrirDial = function(){
      var r = origAbrir.apply(this, arguments);
      setTimeout(function(){
        if(_state.initialized) buildGhostSlots();
        else init();
      }, 600);
      return r;
    };
    clearInterval(hookT);
  }, 200);

  // Hook cerrarDial: limpiar slots
  var origCerrar = null;
  var hookT2 = setInterval(function(){
    if(typeof window.cerrarDial !== 'function') return;
    if(origCerrar){ clearInterval(hookT2); return; }
    origCerrar = window.cerrarDial;
    window.cerrarDial = function(){
      clearGhostSlots();
      hideDropIndicator();
      return origCerrar.apply(this, arguments);
    };
    clearInterval(hookT2);
  }, 200);

  // Debug global
  window._overlayDnd = {
    rebuild: buildGhostSlots,
    save: saveLayout,
    load: loadLayout,
    reset: function(){
      try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
      location.reload();
    },
  };
})();
