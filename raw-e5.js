/* LifeOS — raw-e5.js (COMPARTIDO v9 + v11)
   ═══════════════════════════════════════════════════════════════════
   ÉPOCA E5: · ALCOHOL dentro de SALUD (ex-Nutrición): registro diario
   ml/%/bebida con gramos de alcohol puro calculados + histórico
   · LUCY: carnet completo (ficha, vacunas, visitas con peso,
   desparasitación) con captura vía forms propios · CONTACTOS en el
   panel SOS (hoja CONTACTOS). Requiere Code.gs E5 desplegado y
   setupHojasE5() corrido una vez. Carga DESPUÉS de core (v9) o de
   escena+form (v11): usa gasRun/apiGet/apiPost globales existentes.
   Estética: tokens LifeOS (raw-tokens.css) — nada inventado fuera
   de paleta. ═══════════════════════════════════════════════════════ */
(function(){
'use strict';
if(typeof window.api==='undefined'){ console.warn('[e5] api ausente'); return; }

/* ── extensión de api (mismo patrón EN_GAS?gasRun:apiGet/apiPost) ── */
var EXT = {
  getContactos: function(){ return EN_GAS?gasRun('getContactos'):apiGet('getContactos'); },
  getLucy:      function(){ return EN_GAS?gasRun('getLucy'):apiGet('getLucy'); },
  nuevaLucy:    function(d){ return EN_GAS?gasRun('nuevaLucy',d):apiPost('nuevaLucy',{datos:d}); },
  getAlcohol:   function(){ return EN_GAS?gasRun('getAlcohol'):apiGet('getAlcohol'); },
  nuevoAlcohol: function(d){ return EN_GAS?gasRun('nuevoAlcohol',d):apiPost('nuevoAlcohol',{datos:d}); },
  editarLucyFicha: function(d){ return EN_GAS?gasRun('editarLucyFicha',d):apiPost('editarLucyFicha',{datos:d}); }
};
Object.keys(EXT).forEach(function(k){ if(!window.api[k]) window.api[k]=EXT[k]; });

/* ── estilos E5 (inyectados: un solo archivo para ambas versiones) ── */
(function(){
  var css = [
  '.e5-sec{margin-top:18px;border:1px solid var(--hud-border);border-radius:var(--rad-lg,12px);',
  '  background:var(--hud-panel-bg);padding:14px 16px}',
  '.e5-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}',
  '.e5-hdr .t{font-family:var(--font-mono);font-size:11px;font-weight:800;letter-spacing:.14em;',
  '  text-transform:uppercase;color:var(--e5c,#F59E0B);text-shadow:0 0 10px var(--e5c,#F59E0B)}',
  '.e5-btn{background:color-mix(in srgb,var(--e5c,#F59E0B) 16%,transparent);',
  '  border:1px solid var(--e5c,#F59E0B);color:var(--e5c,#F59E0B);cursor:pointer;',
  '  font-family:var(--font-mono);font-size:10px;font-weight:800;letter-spacing:.1em;',
  '  padding:6px 12px;border-radius:var(--rad-chip,6px);text-transform:uppercase;transition:all .18s var(--ease-hub)}',
  '.e5-btn:hover{background:color-mix(in srgb,var(--e5c,#F59E0B) 30%,transparent);box-shadow:0 0 14px color-mix(in srgb,var(--e5c) 40%,transparent)}',
  '.e5-kpis{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px}',
  '.e5-kpi{flex:1;min-width:110px;border:1px solid var(--hud-border);border-radius:var(--rad-card,8px);',
  '  padding:8px 12px;background:rgba(255,255,255,.02)}',
  '.e5-kpi .l{font-size:9px;letter-spacing:.12em;color:var(--hud-text-dim);text-transform:uppercase}',
  '.e5-kpi .v{font-family:var(--font-mono);font-size:20px;font-weight:700;color:var(--e5c,#F59E0B)}',
  '.e5-tbl{width:100%;border-collapse:collapse;font-size:12px}',
  '.e5-tbl th{font-family:var(--font-mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;',
  '  color:var(--hud-text-dim);text-align:left;padding:6px 8px;border-bottom:1px solid var(--hud-border)}',
  '.e5-tbl td{padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.05);color:var(--hud-text-mid)}',
  '.e5-tbl td.num{font-family:var(--font-mono);color:var(--hud-text)}',
  '.e5-vacio{color:var(--hud-text-faint);font-size:12px;padding:14px 4px;text-align:center}',
  '.e5-modal-ov{position:fixed;inset:0;z-index:9600;background:rgba(4,3,10,.72);backdrop-filter:blur(4px);',
  '  display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .25s var(--ease-hub)}',
  '.e5-modal-ov.show{opacity:1;pointer-events:auto}',
  '.e5-modal{width:min(94vw,480px);background:var(--hud-form-bg);border:1px solid var(--e5c,#EC4899);',
  '  border-radius:var(--rad-lg,12px);padding:18px 20px;box-shadow:var(--mat-elev-3),0 0 30px color-mix(in srgb,var(--e5c) 25%,transparent)}',
  '.e5-modal h3{margin:0 0 14px 0;font-size:15px;color:var(--hud-text);display:flex;align-items:center;gap:8px}',
  '.e5-f{margin-bottom:10px}',
  '.e5-f label{display:block;font-family:var(--font-mono);font-size:9px;letter-spacing:.12em;',
  '  text-transform:uppercase;color:var(--hud-text-dim);margin-bottom:4px}',
  '.e5-f input,.e5-f select{width:100%;box-sizing:border-box;background:rgba(255,255,255,.04);',
  '  border:1px solid var(--hud-border);border-radius:var(--rad-card,8px);color:var(--hud-text);',
  '  padding:9px 10px;font-size:14px;font-family:var(--font-ui)}',
  '.e5-f input:focus,.e5-f select:focus{outline:none;border-color:var(--e5c,#EC4899)}',
  '.e5-acciones{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}',
  '.e5-tabs{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}',
  '.e5-tab{cursor:pointer;font-family:var(--font-mono);font-size:9px;font-weight:800;letter-spacing:.1em;',
  '  text-transform:uppercase;padding:5px 10px;border-radius:999px;border:1px solid var(--hud-border);',
  '  color:var(--hud-text-dim);transition:all .18s var(--ease-hub)}',
  '.e5-tab.on{color:#F9A8D4;border-color:#F9A8D4;background:rgba(249,168,212,.12);box-shadow:0 0 10px rgba(249,168,212,.25)}',
  '.e5-ficha{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-bottom:12px}',
  '.e5-ficha .it{border:1px solid var(--hud-border);border-radius:var(--rad-card,8px);padding:7px 10px;background:rgba(255,255,255,.02)}',
  '.e5-ficha .it .l{font-size:8px;letter-spacing:.12em;color:var(--hud-text-dim);text-transform:uppercase}',
  '.e5-ficha .it .v{font-size:13px;color:var(--hud-text)}',
  '.e5-cont-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}',
  '.e5-cont{border:1px solid var(--hud-border);border-radius:var(--rad-card,8px);padding:10px 12px;',
  '  background:rgba(255,255,255,.02);transition:border-color .18s var(--ease-hub)}',
  '.e5-cont:hover{border-color:#EF4444}',
  '.e5-cont .n{font-weight:700;color:var(--hud-text);font-size:14px}',
  '.e5-cont .a{font-size:10px;color:#FCA5A5;letter-spacing:.06em;text-transform:uppercase;margin:2px 0 6px}',
  '.e5-cont .d{font-size:12px;color:var(--hud-text-mid)}',
  '.e5-cont a{color:#67E8F9;text-decoration:none}'
  ].join('\n');
  var st=document.createElement('style');st.id='e5-css';st.textContent=css;
  document.head.appendChild(st);
})();

function _fmtF(v){
  if(v instanceof Date) return v.toLocaleDateString('es-MX');
  if(typeof v==='string' && v.indexOf('T')>0) { var d=new Date(v); if(!isNaN(d)) return d.toLocaleDateString('es-MX'); }
  return String(v||'');
}
function _toast(msg){
  if(typeof showToast==='function') showToast(msg);
  else if(window._v11Hint) window._v11Hint(msg);
  else console.log('[e5]',msg);
}

/* ═══ MODAL genérico E5 ═══ */
function _modal(color, titulo, cuerpoHTML, onSave){
  var ov=document.createElement('div');ov.className='e5-modal-ov';
  ov.innerHTML='<div class="e5-modal" style="--e5c:'+color+'"><h3>'+titulo+'</h3>'+
    cuerpoHTML+
    '<div class="e5-acciones">'+
    '<button class="e5-btn" data-x="1" style="--e5c:#94A3B8">Cancelar</button>'+
    '<button class="e5-btn" data-ok="1">Guardar</button></div></div>';
  document.body.appendChild(ov);
  requestAnimationFrame(function(){ ov.classList.add('show'); });
  function cerrar(){ ov.classList.remove('show'); setTimeout(function(){ov.remove();},260); }
  ov.addEventListener('click',function(e){
    if(e.target===ov || e.target.dataset.x) cerrar();
    if(e.target.dataset.ok){
      var datos={}; ov.querySelectorAll('[data-k]').forEach(function(i){ datos[i.dataset.k]=i.value; });
      onSave(datos, cerrar, e.target);
    }
  });
  return ov;
}
function _campo(k,l,tipo,extra,val){
  var v=(val===undefined||val===null)?'':String(val).replace(/"/g,'&quot;');
  return '<div class="e5-f"><label>'+l+'</label><input data-k="'+k+'" type="'+(tipo||'text')+'" value="'+v+'" '+(extra||'')+'></div>';
}

/* ═══ ALCOHOL (dentro de SALUD, ex-Nutrición) ═══ */
var _alcData=null;
function _e5AlcoholRender(){
  var host=document.getElementById('e5-alcohol'); if(!host) return;
  var d=_alcData||{hoy:{ml:0,gr:0,bebidas:0},registros:[]};
  var filas = (d.registros||[]).slice(0,14).map(function(r){
    return '<tr><td>'+_fmtF(r['Fecha'])+'</td><td>'+(r['Bebida']||'')+'</td>'+
      '<td class="num">'+(r['ml']||0)+' ml</td><td class="num">'+(r['% Alc']||0)+'%</td>'+
      '<td class="num">'+(r['Alcohol puro (g)']||0)+' g</td></tr>';
  }).join('');
  host.innerHTML =
    '<div class="e5-hdr"><span class="t">🍺 Alcohol · registro diario</span>'+
    '<button class="e5-btn" id="e5-alc-add">+ Registrar</button></div>'+
    '<div class="e5-kpis">'+
    '<div class="e5-kpi"><div class="l">Hoy · ml</div><div class="v">'+d.hoy.ml+'</div></div>'+
    '<div class="e5-kpi"><div class="l">Hoy · alcohol puro</div><div class="v">'+d.hoy.gr+' g</div></div>'+
    '<div class="e5-kpi"><div class="l">Hoy · bebidas</div><div class="v">'+d.hoy.bebidas+'</div></div></div>'+
    _e5Semana(d.registros||[])+
    (filas
      ? '<table class="e5-tbl"><tr><th>Fecha</th><th>Bebida</th><th>ml</th><th>%</th><th>Puro</th></tr>'+filas+'</table>'
      : '<div class="e5-vacio">Sin registros aún — tu histórico de análisis nace con el primero.</div>');
  document.getElementById('e5-alc-add').onclick=function(){
    _modal('#F59E0B','🍺 Registrar bebida',
      _campo('bebida','Bebida (cerveza, vino, mezcal…)')+
      _campo('ml','Cantidad (ml)','number','min="0" step="10"')+
      _campo('pct','Graduación (% alc.)','number','min="0" max="96" step="0.5"')+
      _campo('notas','Notas (opcional)'),
      function(datos,cerrar,btn){
        if(!datos.bebida||!datos.ml||!datos.pct){ _toast('Faltan bebida, ml o %'); return; }
        btn.textContent='Guardando…';
        api.nuevoAlcohol(datos).then(function(r){
          if(r&&r.ok){ _toast('✓ '+r.gr+' g de alcohol puro registrados'); cerrar(); _e5AlcoholCargar(); }
          else _toast('Error: '+((r&&r.error)||'?'));
        }).catch(function(){ _toast('Error de conexión'); });
      });
  };
}
function _e5AlcoholCargar(){
  api.getAlcohol().then(function(r){ if(r&&r.ok){ _alcData=r; _e5AlcoholRender(); } })
    .catch(function(){});
}
function _e5AlcoholMontar(){
  var body=document.getElementById('nut-panel-body')||document.getElementById('board-nutricion');
  if(!body) return;
  if(document.getElementById('e5-alcohol')) return;
  var sec=document.createElement('div');
  sec.className='e5-sec'; sec.id='e5-alcohol'; sec.style.setProperty('--e5c','#F59E0B');
  body.appendChild(sec);
  _e5AlcoholRender(); _e5AlcoholCargar();
}
/* colgarse del render de nutrición/salud (existe en ambas versiones) */
(function(){
  var espera=setInterval(function(){
    if(typeof window._renderNutLayoutCompleto==='function' && !window._renderNutLayoutCompleto.__e5){
      var base=window._renderNutLayoutCompleto;
      window._renderNutLayoutCompleto=function(d){ base(d); _e5AlcoholMontar(); };
      window._renderNutLayoutCompleto.__e5=true;
      clearInterval(espera);
    }
  },400);
  setTimeout(function(){clearInterval(espera);},15000);
})();

/* ═══ LUCY — carnet completo ═══ */
var _lucyData=null, _lucyTab='vacunas';
window._lucyForm=function(tipo){
  var defs={
    vacuna:['#EC4899','💉 Nueva vacuna',
      _campo('fecha','Fecha','date')+_campo('vacuna','Vacuna')+_campo('lote','Lote')+
      _campo('vet','Veterinario / Clínica')+_campo('proxima','Próxima dosis','date')+_campo('notas','Notas')],
    visita:['#EC4899','🩺 Nueva visita médica',
      _campo('fecha','Fecha','date')+_campo('motivo','Motivo')+_campo('diagnostico','Diagnóstico')+
      _campo('tratamiento','Tratamiento / Medicamento')+_campo('peso','Peso (kg)','number','step="0.1"')+
      _campo('costo','Costo','number','step="1"')+_campo('proxima','Próxima cita','date')+_campo('notas','Notas')],
    despara:['#EC4899','🪱 Desparasitación',
      _campo('fecha','Fecha','date')+_campo('producto','Producto')+
      '<div class="e5-f"><label>Tipo</label><select data-k="tipoD"><option>Interna</option><option>Externa</option><option>Mixta</option></select></div>'+
      _campo('proxima','Próxima','date')+_campo('notas','Notas')]
  };
  var d=defs[tipo]; if(!d) return;
  _modal(d[0], d[1], d[2], function(datos,cerrar,btn){
    if(!datos.fecha){ _toast('Pon al menos la fecha'); return; }
    datos.tipo=tipo; btn.textContent='Guardando…';
    api.nuevaLucy(datos).then(function(r){
      if(r&&r.ok){ _toast('✓ Registrado en el carnet ('+r.id+')'); cerrar(); _lucyCargar(); }
      else _toast('Error: '+((r&&r.error)||'?'));
    }).catch(function(){ _toast('Error de conexión'); });
  });
};
function _lucyRender(){
  var host=document.getElementById('e5-lucy'); if(!host) return;
  var d=_lucyData;
  if(!d){ host.innerHTML='<div class="e5-vacio">Cargando carnet…</div>'; return; }
  var ficha=d.ficha||{};
  var fichaHTML=Object.keys(ficha).map(function(k){
    return '<div class="it" style="cursor:pointer" title="Clic para editar" '+
      'onclick="_lucyEditarCampo(\''+k.replace(/'/g,"\\'")+'\')">'+
      '<div class="l">'+k+' ✎</div><div class="v">'+(_fmtF(ficha[k])||'—')+'</div></div>';
  }).join('')||'<div class="e5-vacio">Llena la pestaña LUCY del Sheet (ficha) — corre setupHojasE5 si no existe.</div>';
  function tabla(rows,cols){
    if(!rows||!rows.length) return '<div class="e5-vacio">Sin registros.</div>';
    var th='<tr>'+cols.map(function(c){return '<th>'+c+'</th>';}).join('')+'</tr>';
    var tr=rows.slice().reverse().map(function(r){
      return '<tr>'+cols.map(function(c){
        var v=r[c]; var cls=(typeof v==='number')?' class="num"':'';
        return '<td'+cls+'>'+_fmtF(v)+'</td>';
      }).join('')+'</tr>';
    }).join('');
    return '<table class="e5-tbl">'+th+tr+'</table>';
  }
  var cuerpo = _lucyTab==='vacunas'
      ? tabla(d.vacunas,['ID','Fecha','Vacuna','Lote','Veterinario/Clínica','Próxima dosis'])
    : _lucyTab==='visitas'
      ? tabla(d.visitas,['ID','Fecha','Motivo','Diagnóstico','Peso (kg)','Próxima cita'])
      : tabla(d.despara,['ID','Fecha','Producto','Tipo (interna/externa)','Próxima']);
  host.innerHTML =
    '<div class="e5-hdr"><span class="t" style="--e5c:#F9A8D4">🐾 LUCY · Carnet</span>'+
    '<span><button class="e5-btn" style="--e5c:#EC4899" onclick="_lucyForm(\'vacuna\')">+ Vacuna</button> '+
    '<button class="e5-btn" style="--e5c:#EC4899" onclick="_lucyForm(\'visita\')">+ Visita</button> '+
    '<button class="e5-btn" style="--e5c:#EC4899" onclick="_lucyForm(\'despara\')">+ Despara</button></span></div>'+
    '<div class="e5-ficha">'+fichaHTML+'</div>'+
    '<div class="e5-tabs">'+['vacunas','visitas','despara'].map(function(t){
      return '<span class="e5-tab'+(t===_lucyTab?' on':'')+'" data-t="'+t+'">'+t+'</span>';
    }).join('')+'</div>'+cuerpo;
  host.querySelectorAll('.e5-tab').forEach(function(el){
    el.onclick=function(){ _lucyTab=el.dataset.t; _lucyRender(); };
  });
}
function _lucyCargar(){
  api.getLucy().then(function(r){ if(r&&r.ok){ _lucyData=r; _lucyRender(); } })
    .catch(function(){});
}
window._lucyEditarCampo=function(campo){
  var actual=(_lucyData&&_lucyData.ficha&&_lucyData.ficha[campo])||'';
  _modal('#EC4899','✎ '+campo,
    '<div class="e5-f"><label>'+campo+'</label><input data-k="valor" value="'+String(actual).replace(/"/g,'&quot;')+'"></div>',
    function(datos,cerrar,btn){
      btn.textContent='Guardando…';
      api.editarLucyFicha({campo:campo, valor:datos.valor}).then(function(r){
        if(r&&r.ok){ _toast('✓ Ficha actualizada'); cerrar(); _lucyCargar(); }
        else _toast('Error: '+((r&&r.error)||'?'));
      }).catch(function(){ _toast('Error de conexión'); });
    });
};
window._lucyMontar=function(target){
  if(!target) return;
  var host=document.getElementById('e5-lucy');
  if(!host){ host=document.createElement('div');host.id='e5-lucy';
    host.className='e5-sec';host.style.setProperty('--e5c','#F9A8D4'); }
  target.appendChild(host);
  _lucyRender(); _lucyCargar();
};
/* v9: acceso directo — pantalla propia sobre todo (patrón modal timers) */

/* ═══ MÉDICO — sección propia (E5-E). MI MÉDICO primero (registros de
   la hoja Salud, los que vivían en bitácora), LUCY después (carnet
   embebido). Captura SIEMPRE desde el dial o los botones +. ═══ */
/* E5-D5: puente v9 — el tab MÉDICO entra por el router real
   (_OS_SECCIONES ya lo registra; las flechas lo incluyen) */
/* E5-D6 · DEFENSA EN PROFUNDIDAD (v9):
   a) registro runtime en _OS_SECCIONES — MÉDICO existe para el router
      y las FLECHAS aunque corra un raw-core sin el registro;
   b) vigía de montaje — si el router muestra 'medico' por cualquier
      ruta y el board está vacío, se monta solo;
   c) vigía de HOME — si tras volver a niv-0 el dial quedó invisible
      (cascada interrumpida), se reabre una vez. */
(function(){
  function _blindar(){
    if(window._OS_SECCIONES && !window._OS_SECCIONES.medico){
      window._OS_SECCIONES.medico = { board:'board-medico', tab:'btn-medico' };
      console.log('[e5] medico inyectado en _OS_SECCIONES (core previo)');
    }
  }
  _blindar(); document.addEventListener('DOMContentLoaded', _blindar);
  setInterval(function(){
    /* montaje por flechas u otra ruta */
    if(window._osSeccion==='medico'){
      var b=document.getElementById('board-medico');
      if(b && !document.getElementById('e5-medico') &&
         typeof window._medicoMontar==='function') window._medicoMontar();
    }
    /* E5-G: vigía de HOME RETIRADO — disparaba en el arranque
       (a 800ms el dial legítimamente aún no es visible), secuestraba
       el boot con un abrirDial prematuro → cards en display:none y
       backdrop pegado (el 'blur gigantesco'). */
  }, 400);
})();

/* ═══════════════════════════════════════════════════════════════════
   E5-N — CONTACTOS: sección de primera clase (patrón Apple Contactos:
   maestro-detalle). Izquierda: buscador vivo + chips de afinidad +
   lista scrolleable agrupada. Derecha: la CARD PADRE del contacto con
   toda su información y ACCIONES ejecutables (☎ tel:, ✉ mailto:,
   📍 maps, 🎂). Bidireccional con la hoja CONTACTOS (lee getContactos;
   escribe nuevoContacto). El gajo 13 CONTACTO captura vía form propio
   (nombre + 1 teléfono obligatorios; el resto opcional pero presente).
   Scrolls contenidos por el Contrato de Contención. ═══ */
['editarContacto','eliminarContactos','crearMeet','crearEvento'].forEach(function(fn){
  if(!window.api[fn]) window.api[fn]=function(d){return EN_GAS?gasRun(fn,d):apiPost(fn,{datos:d});};
});
if(!window.api.nuevoContacto)
  window.api.nuevoContacto=function(d){return EN_GAS?gasRun('nuevoContacto',d):apiPost('nuevoContacto',{datos:d});};

var _ctData=[], _ctSel=null, _ctQ='', _ctAf='', _ctGrupo='', _ctModo=false, _ctMarcados={};
var _CT_ALIAS = {
  'Nombre':['Nombre','NOMBRE','Name','nombre'],
  'Apellido':['Apellido','APELLIDO','Apellidos','apellido'],
  'Teléfono 1':['Teléfono 1','Telefono 1','Tel 1','Teléfono1','Telefono1','Tel1','TELÉFONO 1'],
  'Teléfono 2':['Teléfono 2','Telefono 2','Tel 2','Tel2'],
  'Teléfono 3':['Teléfono 3','Telefono 3','Tel 3','Tel3'],
  'Email':['Email','EMAIL','Correo','Mail','E-mail'],
  'Redes':['Redes','REDES','Redes sociales','Social'],
  'Dirección':['Dirección','Direccion','DIRECCIÓN','Domicilio'],
  'Cumpleaños':['Cumpleaños','Cumpleanos','CUMPLEAÑOS','Cumple'],
  'Afinidad':['Afinidad','AFINIDAD','Parentesco','Relación','Relacion'],
  'Notas':['Notas','NOTAS','Nota'],
  'ID':['ID','Id','id']
};
function _ctCampo(x,k){
  var lista=_CT_ALIAS[k]||[k];
  for(var i=0;i<lista.length;i++){
    if(x[lista[i]]!==undefined && String(x[lista[i]]).trim()!=='')
      return String(x[lista[i]]).trim();
  }
  return '';
}
function _ctNombre(x){ return (_ctCampo(x,'Nombre')+' '+_ctCampo(x,'Apellido')).trim()||'(sin nombre)'; }

function _ctLista(){
  var q=_ctQ.toLowerCase();
  var f=_ctData.filter(function(x){
    if(_ctGrupo){
      var gs=_ctCampo(x,'Grupos').split(',').map(function(s){return s.trim();});
      if(gs.indexOf(_ctGrupo)<0) return false;
    }
    if(_ctAf && _ctCampo(x,'Afinidad')!==_ctAf) return false;
    if(!q) return true;
    return Object.keys(x).some(function(k){ return String(x[k]).toLowerCase().indexOf(q)>=0; });
  }).sort(function(a,b){ return _ctNombre(a).localeCompare(_ctNombre(b)); });
  var el=document.getElementById('ct-lista'); if(!el) return;
  if(!f.length){ el.innerHTML='<div class="e5-vacio">Sin resultados.</div>'; return; }
  var letra='';
  el.innerHTML=f.map(function(x){
    var L=_ctNombre(x)[0].toUpperCase(), sep='';
    if(L!==letra){ letra=L; sep='<div class="ct-letra">'+L+'</div>'; }
    var on=(_ctSel&&_ctCampo(_ctSel,'ID')===_ctCampo(x,'ID'))?' on':'';
    var chk=_ctModo?'<span class="ct-chk'+(_ctMarcados[_ctCampo(x,'ID')]?' on':'')+'"></span>':'';
    return sep+'<div class="ct-item'+on+'" data-id="'+_ctCampo(x,'ID')+'">'+chk+
      '<div class="ct-n">'+_ctNombre(x)+'</div>'+
      ((_ctCampo(x,'Afinidad'))?'<div class="ct-a">'+_ctCampo(x,'Afinidad')+'</div>':'')+'</div>';   /* E5-Q: sin guion */
  }).join('');
  el.querySelectorAll('.ct-item').forEach(function(it){
    it.onclick=function(){
      if(_ctModo){
        var id=it.dataset.id;
        if(_ctMarcados[id]) delete _ctMarcados[id]; else _ctMarcados[id]=1;
        _ctLista(); _ctBarra(); return;
      }
      _ctSel=_ctData.find(function(x){return _ctCampo(x,'ID')===it.dataset.id;})||null;
      _ctLista(); _ctDetalle();
    };
  });
}
function _ctDetalle(){
  var el=document.getElementById('ct-detalle'); if(!el) return;
  var x=_ctSel;
  if(!x){ el.innerHTML='<div class="e5-vacio" style="padding-top:60px">Selecciona un contacto — o crea uno desde el gajo CONTACTO del dial.</div>'; return; }
  function fila(icono,label,valor,accion){
    if(!valor) return '';
    return '<div class="ct-f"><div class="ct-fl">'+icono+' '+label+'</div>'+
      '<div class="ct-fv">'+(accion?'<a href="'+accion+'">'+valor+'</a>':valor)+'</div></div>';
  }
  var tels=[['Teléfono 1','tel1'],['Teléfono 2','tel2'],['Teléfono 3','tel3']]
    .map(function(p){ var t=_ctCampo(x,p[0]); return t?fila('☎',p[0],t,'tel:'+t.replace(/\s/g,'')):''; }).join('');
  var mail=_ctCampo(x,'Email');
  var dir=_ctCampo(x,'Dirección');
  el.innerHTML=
    '<div class="ct-hero"><div class="ct-avatar"><svg viewBox="0 0 24 24" width="30" height="30" fill="rgba(255,255,255,.85)"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5"/></svg></div>'+
    '<div><div class="ct-hn">'+_ctNombre(x)+' <span class="ct-id">'+(_ctCampo(x,'ID')||'')+'</span></div>'+
    '<div class="ct-ha">'+(_ctCampo(x,'Afinidad')||'')+'</div></div></div>'+
    (function(){
      var t1=_ctCampo(x,'Teléfono 1').replace(/\s/g,'');
      var num=t1.replace(/[^0-9+]/g,'');
      return '<div class="ct-acciones">'+
      (t1?'<a class="e5-btn" style="--e5c:#4ADE80" href="tel:'+t1+'">☎ Llamar</a>':'')+
      (t1?'<a class="e5-btn" style="--e5c:#A7F3D0" href="sms:'+t1+'">💬 SMS</a>':'')+
      (num?'<a class="e5-btn" style="--e5c:#25D366" target="_blank" href="https://wa.me/'+num.replace('+','')+'">🟢 WhatsApp</a>':'')+
      (num?'<a class="e5-btn" style="--e5c:#29B6F6" target="_blank" href="https://t.me/'+num+'">✈ Telegram</a>':'')+
      (mail?'<a class="e5-btn" style="--e5c:#60A5FA" href="mailto:'+mail+'">✉ Correo</a>':'')+
      (mail?'<button class="e5-btn" style="--e5c:#F87171" onclick="_ctMeet()">📹 Meet</button>':'')+
      (dir?'<a class="e5-btn" style="--e5c:#F59E0B" target="_blank" href="https://maps.google.com/?q='+encodeURIComponent(dir)+'">📍 Mapa</a>':'')+
      '<button class="e5-btn" style="--e5c:#C4B5FD" onclick="_ctEditar()">✎ Editar</button>'+
      '</div>';
    })()+
    tels+
    fila('✉','Email',mail,'mailto:'+mail)+
    fila('🌐','Redes',_ctCampo(x,'Redes'))+
    fila('📍','Dirección',dir)+
    fila('🎂','Cumpleaños',_fmtF(x['Cumpleaños']))+
    fila('🤝','Afinidad',_ctCampo(x,'Afinidad'))+
    fila('📝','Notas',_ctCampo(x,'Notas'));
}
function _ctChips(){
  var el=document.getElementById('ct-chips'); if(!el) return;
  var gps={}; _ctData.forEach(function(x){ _ctCampo(x,'Grupos').split(',').forEach(function(s){ s=s.trim(); if(s) gps[s]=1; }); });
  var gEl=document.getElementById('ct-grupos');
  if(gEl){
    var lgs=Object.keys(gps).sort();
    gEl.innerHTML = lgs.length
      ? '<div class="ct-letra" style="border:none;padding-top:0">LISTAS</div>'+
        '<span class="e5-tab'+(_ctGrupo===''?' on':'')+'" data-g="">Todas</span>'+
        lgs.map(function(g){return '<span class="e5-tab'+(_ctGrupo===g?' on':'')+'" data-g="'+g+'">'+g+'</span>';}).join('')
      : '';
    gEl.querySelectorAll('.e5-tab').forEach(function(ch){
      ch.onclick=function(){ _ctGrupo=ch.dataset.g; _ctChips(); _ctLista(); };
    });
  }
  var afs={}; _ctData.forEach(function(x){ var a=_ctCampo(x,'Afinidad'); if(a) afs[a]=1; });
  el.innerHTML='<span class="e5-tab'+(_ctAf===''?' on':'')+'" data-af="">Todos</span>'+
    Object.keys(afs).sort().map(function(a){
      return '<span class="e5-tab'+(_ctAf===a?' on':'')+'" data-af="'+a+'">'+a+'</span>';
    }).join('');
  el.querySelectorAll('.e5-tab').forEach(function(ch){
    ch.onclick=function(){ _ctAf=ch.dataset.af; _ctChips(); _ctLista(); };
  });
}
function _ctBarra(){
  var el=document.getElementById('ct-barra'); if(!el) return;
  var n=Object.keys(_ctMarcados).length;
  if(!_ctModo){ el.innerHTML=''; return; }
  el.innerHTML='<span style="font-family:var(--font-mono);font-size:10px;color:#93C5FD">'+n+' seleccionados</span> '+
    '<button class="e5-btn" style="--e5c:#60A5FA" id="ct-alista"'+(n?'':' disabled')+'>+ A lista</button> '+
    '<button class="e5-btn" style="--e5c:#EF4444" id="ct-borrar"'+(n?'':' disabled')+'>🗑 Eliminar</button> '+
    '<button class="e5-btn" style="--e5c:#94A3B8" id="ct-cancelar">Cancelar</button>';
  var ids=Object.keys(_ctMarcados);
  el.querySelector('#ct-cancelar').onclick=function(){ _ctModo=false; _ctMarcados={}; _ctBarra(); _ctLista();
    document.getElementById('ct-selbtn').textContent='☑ Seleccionar'; };
  var aL=el.querySelector('#ct-alista');
  if(aL) aL.onclick=function(){
    var gps={}; _ctData.forEach(function(x){ _ctCampo(x,'Grupos').split(',').forEach(function(s){s=s.trim();if(s)gps[s]=1;}); });
    _modal('#60A5FA','📋 Añadir '+ids.length+' a lista',
      '<div class="e5-f"><label>Lista (elige o escribe nueva)</label>'+
      '<input data-k="lista" list="ct-listas-dl"><datalist id="ct-listas-dl">'+
      Object.keys(gps).sort().map(function(g){return '<option value="'+g+'">';}).join('')+'</datalist></div>',
      function(datos,cerrar,btn){
        var L=String(datos.lista||'').trim(); if(!L){ _toast('Nombra la lista'); return; }
        btn.textContent='Guardando…';
        var pend=ids.length;
        ids.forEach(function(id){
          var x=_ctData.find(function(c){return _ctCampo(c,'ID')===id;});
          var gs=_ctCampo(x,'Grupos').split(',').map(function(s){return s.trim();}).filter(Boolean);
          if(gs.indexOf(L)<0) gs.push(L);
          api.editarContacto({ID:id, grupos:gs.join(', ')}).then(function(){ if(--pend===0){
            _toast('✓ '+ids.length+' añadidos a "'+L+'" (también en tu Sheet)');
            cerrar(); _ctModo=false; _ctMarcados={};
            document.getElementById('ct-selbtn').textContent='☑ Seleccionar';
            window._contactosMontar(); } });
        });
      });
  };
  var bR=el.querySelector('#ct-borrar');
  if(bR) bR.onclick=function(){
    _modal('#EF4444','🗑 Eliminar '+ids.length+' contacto(s)',
      '<div style="font-size:13px;color:var(--hud-text-mid)">Se borrarán de la app Y de tu Sheet. Sin deshacer.</div>',
      function(datos,cerrar,btn){
        btn.textContent='Eliminando…';
        api.eliminarContactos({ids:ids}).then(function(r){
          if(r&&r.ok){ _toast('✓ '+r.eliminados+' eliminados'); cerrar();
            _ctModo=false; _ctMarcados={}; _ctSel=null;
            document.getElementById('ct-selbtn').textContent='☑ Seleccionar';
            window._contactosMontar(); }
          else _toast('Error: '+((r&&r.error)||'?'));
        });
      });
  };
}
window._contactosMontar=function(target){
  var board=target||document.getElementById('board-contactos'); if(!board) return;
  if(!document.getElementById('ct-root')){
    var css=document.createElement('style'); css.id='ct-css';
    css.textContent=[
    '#ct-root{display:grid;grid-template-columns:minmax(260px,340px) 1fr;gap:16px;',
    '  padding:18px 2.5vw 26px;height:100%;box-sizing:border-box;min-height:0}',
    '#ct-izq{display:flex;flex-direction:column;min-height:0;border:1px solid var(--hud-border);',
    '  border-radius:var(--rad-lg,12px);background:var(--hud-panel-bg);padding:12px}',
    '#ct-busca{width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);',
    '  border:1px solid var(--hud-border);border-radius:8px;color:var(--hud-text);',
    '  padding:9px 12px;font-size:13px;margin-bottom:8px}',
    '#ct-busca:focus{outline:none;border-color:#60A5FA}',
    '#ct-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}',
    '#ct-lista{flex:1;min-height:0;overflow-y:auto;scrollbar-width:thin}',
    '.ct-letra{font-family:var(--font-mono);font-size:10px;color:#60A5FA;',
    '  letter-spacing:.2em;padding:8px 6px 3px;border-bottom:1px solid var(--hud-border)}',
    '.ct-item{padding:8px 8px;border-radius:8px;cursor:pointer;transition:background .15s}',
    '.ct-item:hover{background:rgba(96,165,250,.08)}',
    '.ct-item.on{background:rgba(96,165,250,.16);box-shadow:inset 2px 0 0 #60A5FA}',
    '.ct-item{display:flex;align-items:center;gap:8px}',
    '.ct-item>div{min-width:0}',
    '.ct-chk{width:16px;height:16px;border-radius:50%;border:1.5px solid #60A5FA;flex-shrink:0}',
    '.ct-chk.on{background:#60A5FA;box-shadow:0 0 8px rgba(96,165,250,.6)}',
    '.ct-n{font-size:13.5px;color:var(--hud-text);font-weight:600}',
    '.ct-a{font-size:10px;color:var(--hud-text-dim);text-transform:uppercase;letter-spacing:.08em}',
    '#ct-detalle{border:1px solid var(--hud-border);border-radius:var(--rad-lg,12px);',
    '  background:var(--hud-panel-bg);padding:20px 26px;overflow-y:auto;min-height:0;scrollbar-width:thin}',
    '.ct-hero{display:flex;align-items:center;gap:16px;margin-bottom:14px}',
    '.ct-avatar{width:58px;height:58px;border-radius:50%;display:flex;align-items:center;',
    '  justify-content:center;font-family:var(--font-mono);font-weight:800;font-size:20px;',
    '  color:#fff;background:linear-gradient(135deg,#60A5FA,#7C3AED);',
    '  box-shadow:0 0 18px rgba(96,165,250,.4)}',
    '.ct-hn{font-size:20px;font-weight:700;color:var(--hud-text)}',
    '.ct-id{font-family:var(--font-mono);font-size:10px;color:var(--hud-text-faint)}',
    '.ct-ha{font-size:11px;color:#93C5FD;text-transform:uppercase;letter-spacing:.1em}',
    '.ct-acciones{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 16px}',
    '.ct-acciones a{text-decoration:none}',
    '.ct-f{display:grid;grid-template-columns:150px 1fr;gap:10px;padding:8px 0;',
    '  border-bottom:1px solid rgba(255,255,255,.05);font-size:13px}',
    '.ct-fl{color:var(--hud-text-dim);font-size:11px;letter-spacing:.06em;text-transform:uppercase}',
    '.ct-fv{color:var(--hud-text)} .ct-fv a{color:#67E8F9;text-decoration:none}',
    '@media(max-width:1000px){#ct-root{grid-template-columns:1fr;grid-template-rows:minmax(200px,40%) 1fr}}'
    ].join('\n');
    document.head.appendChild(css);
    var root=document.createElement('div'); root.id='ct-root';
    root.innerHTML=
      '<div id="ct-izq">'+
      '<div class="e5-hdr" style="margin-bottom:8px"><span class="t" style="--e5c:#60A5FA">📇 CONTACTOS</span>'+
      '<span><button class="e5-btn" style="--e5c:#93C5FD" id="ct-selbtn">☑ Seleccionar</button> '+
      '<button class="e5-btn" style="--e5c:#60A5FA" onclick="irAContactoForm()">+ Nuevo</button></span></div>'+
      '<input id="ct-busca" placeholder="Buscar en todo…">'+
      '<div id="ct-barra" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:6px"></div>'+
      '<div id="ct-grupos" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px"></div>'+
      '<div id="ct-chips"></div><div id="ct-lista"></div></div>'+
      '<div id="ct-detalle"></div>';
    board.appendChild(root);
    document.getElementById('ct-busca').addEventListener('input',function(){
      _ctQ=this.value; _ctLista();
    });
    document.getElementById('ct-selbtn').onclick=function(){
      _ctModo=!_ctModo; if(!_ctModo)_ctMarcados={};
      this.textContent=_ctModo?'✕ Salir de selección':'☑ Seleccionar';
      _ctBarra(); _ctLista();
    };
  }
  _ctLista(); _ctDetalle(); _ctChips();
  api.getContactos().then(function(r){
    if(r&&r.ok){ _ctData=r.contactos||[]; _ctChips(); _ctLista();
      if(_ctSel){ _ctSel=_ctData.find(function(x){return _ctCampo(x,'ID')===_ctCampo(_ctSel,'ID');})||null; _ctDetalle(); }
      if(!_ctData.length){
        var el=document.getElementById('ct-lista');
        if(el) el.innerHTML='<div class="e5-vacio">La hoja respondió OK pero sin filas legibles — revisa que los datos empiecen en la fila 2 bajo encabezados en la fila 1.</div>';
      }
    } else {
      var el=document.getElementById('ct-lista');
      if(el) el.innerHTML='<div class="e5-vacio" style="color:#FCA5A5">⚠ '+((r&&r.error)||'El backend no respondió: ¿desplegaste el Code.gs E5-N con Nueva versión?')+'</div>';
    }
  }).catch(function(err){
    var el=document.getElementById('ct-lista');
    if(el) el.innerHTML='<div class="e5-vacio" style="color:#FCA5A5">⚠ Sin conexión con el backend.</div>';
  });
};
window.irAContactos=function(){
  if(typeof _osMostrar==='function'){ _osMostrar('contactos'); window._contactosMontar(); }
  else window._contactosMontar();
};
window._ctMeet=function(){
  if(!_ctSel) return;
  var mail=_ctCampo(_ctSel,'Email'), nom=_ctNombre(_ctSel);
  function pad(n){return ('0'+n).slice(-2);}
  function fmtF(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function fmtH(d){return pad(d.getHours())+':'+pad(d.getMinutes());}
  var ahora=new Date();
  var ov=_modal('#F87171','📅 Reunión con '+nom,
    '<div style="font-size:11px;color:var(--hud-text-dim);margin-bottom:10px">'+
    'Invitado: <b style="color:#93C5FD">'+mail+'</b> — recibirá la invitación por correo; '+
    'el evento entra a tu Google Calendar.</div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px" id="ev-atajos">'+
    '<span class="e5-tab" data-min="5">En 5 min</span>'+
    '<span class="e5-tab" data-min="60">En 1 hora</span>'+
    '<span class="e5-tab" data-man="1">Mañana 10:00</span>'+
    '<span class="e5-tab" data-lun="1">Lunes 10:00</span></div>'+
    _campo('titulo','Título',null,null,'Reunión con '+nom)+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">'+
    _campo('fecha','Fecha *','date',null,fmtF(ahora))+
    _campo('hora','Hora *','time',null,fmtH(new Date(ahora.getTime()+10*60000)))+
    '<div class="e5-f"><label>Duración</label><select data-k="duracion">'+
    [15,30,45,60,90,120].map(function(m){return '<option value="'+m+'"'+(m===30?' selected':'')+'>'+m+' min</option>';}).join('')+
    '</select></div></div>'+
    _campo('descripcion','Descripción / agenda (opcional)'),
    function(datos,cerrar,btn){
      if(!datos.fecha||!datos.hora){ _toast('Fecha y hora obligatorias'); return; }
      btn.textContent='Creando…';
      datos.email=mail;
      api.crearEvento(datos).then(function(r){
        _toast(r&&r.ok ? '✓ Evento creado · '+r.nota : 'Error: '+((r&&r.error)||'?'));
        if(r&&r.ok) cerrar(); else btn.textContent='Guardar';
      }).catch(function(){ _toast('Error de conexión'); btn.textContent='Guardar'; });
    });
  /* atajos: rellenan fecha/hora al vuelo */
  ov.querySelectorAll('#ev-atajos .e5-tab').forEach(function(ch){
    ch.style.setProperty('--e5c','#F87171');
    ch.onclick=function(){
      var d=new Date();
      if(ch.dataset.min) d=new Date(d.getTime()+Number(ch.dataset.min)*60000);
      if(ch.dataset.man){ d.setDate(d.getDate()+1); d.setHours(10,0,0,0); }
      if(ch.dataset.lun){ var dd=(8-d.getDay())%7||7; d.setDate(d.getDate()+dd); d.setHours(10,0,0,0); }
      ov.querySelector('[data-k="fecha"]').value=fmtF(d);
      ov.querySelector('[data-k="hora"]').value=fmtH(d);
    };
  });
};
window._ctEditar=function(){
  if(!_ctSel) return;
  var x=_ctSel;
  _modal('#C4B5FD','✎ Editar · '+_ctNombre(x),
    _campo('nombre','Nombre *',null,null,_ctCampo(x,'Nombre'))+
    _campo('apellido','Apellido',null,null,_ctCampo(x,'Apellido'))+
    _campo('tel1','Teléfono 1 *','tel',null,_ctCampo(x,'Teléfono 1'))+
    _campo('tel2','Teléfono 2','tel',null,_ctCampo(x,'Teléfono 2'))+
    _campo('tel3','Teléfono 3','tel',null,_ctCampo(x,'Teléfono 3'))+
    _campo('email','Email','email',null,_ctCampo(x,'Email'))+
    _campo('redes','Redes',null,null,_ctCampo(x,'Redes'))+
    _campo('direccion','Dirección',null,null,_ctCampo(x,'Dirección'))+
    _campo('cumple','Cumpleaños','date',null,'')+
    _campo('afinidad','Afinidad',null,null,_ctCampo(x,'Afinidad'))+
    _campo('grupos','Listas (separadas por coma)',null,null,_ctCampo(x,'Grupos'))+
    _campo('notas','Notas',null,null,_ctCampo(x,'Notas')),
    function(datos,cerrar,btn){
      if(!String(datos.nombre||'').trim()){ _toast('El nombre es obligatorio'); return; }
      if(!String(datos.tel1||'').trim()){ _toast('Al menos un teléfono'); return; }
      btn.textContent='Guardando…';
      datos.ID=_ctCampo(x,'ID');
      api.editarContacto(datos).then(function(r){
        if(r&&r.ok){ _toast('✓ Actualizado — también en tu Sheet'); cerrar(); window._contactosMontar(); }
        else _toast('Error: '+((r&&r.error)||'?'));
      }).catch(function(){ _toast('Error de conexión'); });
    });
};
window.irAContactoForm=function(){
  _modal('#60A5FA','👤 Nuevo contacto',
    _campo('nombre','Nombre *')+_campo('apellido','Apellido')+
    _campo('tel1','Teléfono 1 *','tel')+_campo('tel2','Teléfono 2','tel')+_campo('tel3','Teléfono 3','tel')+
    _campo('email','Email','email')+_campo('redes','Redes (@usuarios)')+
    _campo('direccion','Dirección')+_campo('cumple','Cumpleaños','date')+
    _campo('afinidad','Afinidad (familia, trabajo, de dónde lo conozco)')+
    _campo('notas','Notas'),
    function(datos,cerrar,btn){
      if(!String(datos.nombre||'').trim()){ _toast('El nombre es obligatorio'); return; }
      if(!String(datos.tel1||'').trim()){ _toast('Al menos un teléfono'); return; }
      btn.textContent='Guardando…';
      api.nuevoContacto(datos).then(function(r){
        if(r&&r.ok){ _toast('✓ Contacto '+r.id+' guardado — también en tu Sheet');
          cerrar(); window._contactosMontar(); }
        else _toast('Error: '+((r&&r.error)||'?'));
      }).catch(function(){ _toast('Error de conexión'); });
    });
};
/* E5-U — SALTO DIRECTO 2→HOME: volverAlAnverso desde nivel 2 encadena
   2→1→0 y reproducía las DOS animaciones ("dos parpadeos"). Aquí: si
   partimos de niv-2, se instala un silenciador (sin animación, dial
   oculto) durante el tránsito, y al asentarse niv-0 se reproduce UN
   solo dialEmerger limpio. */
(function(){
  var st=document.createElement('style'); st.id='e5-salto';
  st.textContent='html.e5-saltando #dial-canvas,html.e5-saltando #dial-ambient,'+
    'html.e5-saltando #dial-ring-breath{animation:none !important;opacity:0 !important}';
  document.head.appendChild(st);
  function instalar(){
    if(typeof window.volverAlAnverso!=='function' || window.volverAlAnverso.__e5u) return;
    var base=window.volverAlAnverso;
    window.volverAlAnverso=function(){
      var h=document.documentElement;
      var desde2 = h.classList.contains('niv-2');
      if(desde2){
        h.classList.add('e5-saltando');
        var fin=function(){
          if(!h.classList.contains('niv-0')){ setTimeout(fin,80); return; }
          setTimeout(function(){
            h.classList.remove('e5-saltando');
            var d=document.getElementById('dial-canvas');
            if(d){ d.classList.remove('dial-anim-up'); void d.offsetWidth;
                   d.classList.add('dial-anim-up'); }
          },60);
        };
        setTimeout(fin,120);
        setTimeout(function(){ h.classList.remove('e5-saltando'); },2600); /* red de seguridad */
      }
      return base.apply(this,arguments);
    };
    window.volverAlAnverso.__e5u=true;
  }
  instalar(); document.addEventListener('DOMContentLoaded',instalar);
  setTimeout(instalar,1500);
})();

/* E5-S — bitácora sin médico, por CONTENIDO (independiente del index):
   localiza la columna cuyo header dice MÉDICO/SALUD-clínica y el stat
   MÉDICO, y los oculta. Corre al montar bitácora y en el vigía. */
function _e5BitLimpia(){
  var b=document.getElementById('board-bitacora'); if(!b) return;
  b.querySelectorAll('[data-tipo="salud"],[data-tipo="nutricion"]').forEach(function(col){ col.style.display='none'; });
  b.querySelectorAll('*').forEach(function(el){
    if(el.children.length===0 && /^(MÉDICO|MEDICO|SALUD)$/.test(el.textContent.trim())){
      var caja=el.closest('[class*="col"],[class*="stat"]')||el.parentElement;
      if(caja && caja!==b) caja.style.display='none';
    }
  });
}
if(typeof window._renderBitacoraPanel==='function' && !window._renderBitacoraPanel.__e5b){
  var _rbBase=window._renderBitacoraPanel;
  window._renderBitacoraPanel=function(){ _rbBase(); _e5BitLimpia(); };
  window._renderBitacoraPanel.__e5b=true;
}
setInterval(function(){
  if(window._osSeccion==='bitacora') _e5BitLimpia();
},700);

/* E5-S — BALIZAS: window.e5estado() reporta qué corre realmente */
window.e5estado=function(){
  var r={
    'raw-e5':'E5-S (agenda+eventos+ley dial+bit-limpia)',
    'ley dial (css)': !!document.getElementById('e5-dial-ley'),
    'medico en router': !!(window._OS_SECCIONES&&window._OS_SECCIONES.medico),
    'contactos en router': !!(window._OS_SECCIONES&&window._OS_SECCIONES.contactos),
    'dial items': (window._DIAL_ITEMS||[]).length,
    'api E5': ['getContactos','nuevoContacto','editarContacto','crearEvento','getLucy','getAlcohol']
      .filter(function(f){return !(window.api&&window.api[f]);}).join(',')||'completa'
  };
  console.table(r); return '✓';
};
/* vigía de montaje (flechas u otras rutas) */
setInterval(function(){
  if(window._osSeccion==='sos'){
    var b=document.getElementById('board-sos');
    if(b && !document.getElementById('ct-root') &&
       typeof window._montarSOS==='function' && window._montarSOS.__e5v)
      window._montarSOS();
  }
},600);

window.irAMedico = function(){
  if(typeof _osMostrar==='function'){ _osMostrar('medico'); window._medicoMontar(); }
  else window._medicoMontar();
};
window._medicoMontar=function(target){
  var board = target || document.getElementById('board-medico');
  if(!board) return;
  var host=document.getElementById('e5-medico');
  if(!host){
    host=document.createElement('div'); host.id='e5-medico';
    host.style.cssText='padding:18px 3vw 30px;max-width:1500px;margin:0 auto;width:100%;box-sizing:border-box';
    host.innerHTML =
      '<div style="display:flex;align-items:baseline;gap:14px;margin-bottom:16px">'+
      '<div style="font-family:var(--font-mono);font-size:16px;font-weight:800;'+
      'letter-spacing:.18em;color:#F87171;text-shadow:0 0 12px rgba(248,113,113,.55)">'+
      '<i class="fas fa-heart-pulse"></i> MÉDICO</div>'+
      '<div style="font-size:11px;color:var(--hud-text-dim);letter-spacing:.08em">'+
      'Historial clínico · captura desde el dial (gajos MÉDICO y LUCY)</div></div>'+
      '<div class="e5-sec" id="e5-med-humano" style="--e5c:#F87171"></div>'+
      '<div class="e5-sec" id="e5-med-lucy" style="--e5c:#F9A8D4;margin-top:14px"></div>';
    board.appendChild(host);
  } else if(host.parentNode!==board){ board.appendChild(host); }
  /* 👤 MI MÉDICO — citas, síntomas, medicamentos, resultados */
  function pintarHumano(){
    var h=document.getElementById('e5-med-humano'); if(!h) return;
    var d=window._saludData;
    var items=(d&&d.items)||(Array.isArray(d)?d:[]);
    var filas=items.slice(0,50).map(function(r){
      return '<tr><td class="num">'+_fmtF(r.fecha)+'</td><td>'+(r.tipo||'')+'</td>'+
        '<td>'+(r.descripcion||'')+'</td><td>'+(r.doctor||'')+'</td>'+
        '<td>'+(r.estado||'')+'</td></tr>';
    }).join('');
    h.innerHTML='<div class="e5-hdr"><span class="t" style="--e5c:#F87171">👤 Mi médico</span></div>'+
      (filas
        ? '<table class="e5-tbl"><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Doctor</th><th>Estado</th></tr>'+filas+'</table>'
        : '<div class="e5-vacio">Sin registros — captura desde el gajo MÉDICO del dial (Cita, Síntoma, Medicamento, Resultado, Vacuna).</div>');
  }
  pintarHumano();
  if(window.api && typeof api.getSalud==='function'){
    api.getSalud().then(function(r){
      window._saludData = (r&&r.items)?r:{items:(Array.isArray(r)?r:[])};
      pintarHumano();
    }).catch(function(){});
  }
  /* 🐾 LUCY — el carnet completo como paciente */
  var slot=document.getElementById('e5-med-lucy');
  if(slot && typeof window._lucyMontar==='function'){
    var prev=document.getElementById('e5-lucy');
    if(prev && prev.parentNode && prev.parentNode!==slot) prev.parentNode.removeChild(prev);
    window._lucyMontar(slot);
  }
};
/* reacomodo: la columna/stat médico salen de BITÁCORA (viven aquí) */
(function(){
  var st=document.createElement('style');
  st.textContent='#board-bitacora [data-tipo="salud"]{display:none !important}\n'+
    '#board-bitacora .bit-stat:has(.fa-heart-pulse){display:none !important}';
  document.head.appendChild(st);
})();

window.irALucyVacuna =function(){ window._lucyForm('vacuna'); };
window.irALucyVisita =function(){ window._lucyForm('visita'); };
window.irALucyDespara=function(){ window._lucyForm('despara'); };
window.irALucy=function(){
  var ov=document.getElementById('e5-lucy-ov');
  if(!ov){
    ov=document.createElement('div');ov.id='e5-lucy-ov';
    ov.style.cssText='position:fixed;inset:0;z-index:9500;background:var(--hud-bg-base,#020810);overflow-y:auto;padding:26px 4vw;display:none';
    ov.innerHTML='<button class="e5-btn" style="--e5c:#94A3B8;margin-bottom:12px" '+
      'onclick="document.getElementById(\'e5-lucy-ov\').style.display=\'none\'">‹ Volver</button>'+
      '<div id="e5-lucy-slot"></div>';
    document.body.appendChild(ov);
  }
  ov.style.display='block';
  window._lucyMontar(document.getElementById('e5-lucy-slot'));
};

/* ═══ E5-V — LA AGENDA COMPLETA VIVE EN SOS (renombrado CONTACTOS):
   tarjetas de emergencia arriba (intactas), y debajo el sistema entero
   (maestro-detalle, buscador, listas, selección múltiple, acciones).
   El grid simple anterior queda eliminado — cero duplicados. ═══ */
(function(){
  function montarEnSOS(){
    var board=document.getElementById('board-sos'); if(!board) return;
    var slot=document.getElementById('e5-ct-slot');
    if(!slot){
      slot=document.createElement('div'); slot.id='e5-ct-slot';
      slot.style.cssText='margin-top:22px;height:72vh;min-height:420px;position:relative';
      board.appendChild(slot);
    }
    if(!document.getElementById('ct-root')) window._contactosMontar(slot);
    else window._contactosMontar(slot);
  }
  var espera=setInterval(function(){
    if(typeof window._montarSOS==='function' && !window._montarSOS.__e5v){
      var base=window._montarSOS;
      window._montarSOS=function(){ base(); setTimeout(montarEnSOS,120); };
      window._montarSOS.__e5v=true;
      clearInterval(espera);
    }
  },400);
  setTimeout(function(){clearInterval(espera);},15000);
  /* el gajo 'Ver agenda' y cualquier ruta vieja → SOS */
  window.irAContactos=function(){
    if(typeof irASOS==='function') irASOS();
    else if(typeof _osMostrar==='function'){ _osMostrar('sos'); }
  };
})();



/* E5-C: últimos 7 días — gramos de alcohol puro por día (barras) */
function _e5Semana(regs){
  var dias=[], mapa={};
  for(var i=6;i>=0;i--){
    var d=new Date(); d.setDate(d.getDate()-i);
    var k=('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2);
    dias.push(k); mapa[k]=0;
  }
  regs.forEach(function(r){
    var f=_fmtF(r['Fecha']);              /* dd/mm/aaaa */
    var k=f.slice(0,5);
    if(mapa[k]!==undefined) mapa[k]+=Number(r['Alcohol puro (g)'])||0;
  });
  var max=Math.max.apply(null, dias.map(function(k){return mapa[k];}).concat([1]));
  return '<div style="display:flex;align-items:flex-end;gap:8px;height:64px;margin:4px 2px 14px">'+
    dias.map(function(k){
      var v=Math.round(mapa[k]*10)/10, h=Math.max(3, v/max*54);
      return '<div style="flex:1;text-align:center">'+
        '<div style="font-family:var(--font-mono);font-size:9px;color:'+(v?'#F59E0B':'var(--hud-text-faint)')+'">'+(v||'')+'</div>'+
        '<div style="height:'+h+'px;border-radius:3px 3px 0 0;background:'+(v?'linear-gradient(180deg,#F59E0B,#B45309)':'rgba(255,255,255,.06)')+';box-shadow:'+(v?'0 0 8px rgba(245,158,11,.4)':'none')+'"></div>'+
        '<div style="font-size:8px;letter-spacing:.06em;color:var(--hud-text-dim);margin-top:3px">'+k+'</div></div>';
    }).join('')+'</div>';
}

/* E5-O — LEY DEL DIAL (reinstalada REFINADA): el espía probó que el
   "doble flip" es el canvas aún fixed viajando con transición+overshoot
   al volver a HOME. Se congela SOLO su geometría (top/left/size/
   transform instantáneos) permitiendo opacity Y filter — así los
   blurs/fundidos de v9 quedan intactos (el error de E5-L fue aplicar
   esto a * con solo-opacity). Alcance: únicamente el trío del dial. */
(function(){
  var st=document.createElement('style'); st.id='e5-dial-ley';
  st.textContent='#dial-canvas,#dial-ambient,#dial-ring-breath{'+
    'transition-property:opacity,filter !important}';
  document.head.appendChild(st);
})();

/* E5-N — REVERT de E5-K/L/M: mis tres capas de coreografía (dos-diales,
   ley de entrada solo-opacidad, ley global del dial) interactuaban mal
   con la maquinaria de estados de v9 (blur invertido en cards, giros
   erráticos, HOME sin cargar). Retiradas ÍNTEGRAS. El comportamiento
   del dial vuelve al v9 canónico + E5-J (fade puro en reapertura).
   El mini-dial sin viaje se rehará leyendo su mecanismo real. */

console.log('[e5] E5-S activo · e5estado() para diagnóstico · alcohol+lucy+contactos (api extendida: getContactos/getLucy/nuevaLucy/getAlcohol/nuevoAlcohol)');
})();
