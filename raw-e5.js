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
function _campo(k,l,tipo,extra){
  return '<div class="e5-f"><label>'+l+'</label><input data-k="'+k+'" type="'+(tipo||'text')+'" '+(extra||'')+'></div>';
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
/* E5-D3: SALUD como paraguas — accesos a MÉDICO y LUCY dentro del board */
function _e5AccesosSalud(body){
  if(document.getElementById('e5-accesos')) return;
  var tieneMedico = (typeof window.irABitacora==='function');
  var sec=document.createElement('div');
  sec.className='e5-sec'; sec.id='e5-accesos'; sec.style.setProperty('--e5c','#86EFAC');
  sec.innerHTML='<div class="e5-hdr"><span class="t" style="--e5c:#86EFAC">🌿 Salud · Accesos</span>'+
    '<span>'+
    (tieneMedico
      ? '<button class="e5-btn" style="--e5c:#F87171" onclick="irABitacora()">🩺 Médico</button> '
      : '')+
    '<button class="e5-btn" style="--e5c:#F9A8D4" onclick="irALucy()">🐾 Lucy</button>'+
    '</span></div>';
  body.appendChild(sec);
}
function _e5AlcoholMontar(){
  var body=document.getElementById('nut-panel-body')||document.getElementById('board-nutricion');
  if(!body) return;
  _e5AccesosSalud(body);
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

/* ═══ CONTACTOS en SOS ═══ */
function _e5Contactos(){
  var board=document.getElementById('board-sos');
  if(!board || document.getElementById('e5-contactos')) return;
  var sec=document.createElement('div');
  sec.className='e5-sec';sec.id='e5-contactos';sec.style.setProperty('--e5c','#EF4444');
  sec.innerHTML='<div class="e5-hdr"><span class="t" style="--e5c:#EF4444">📇 Contactos</span></div>'+
    '<div class="e5-cont-grid" id="e5-cont-grid"><div class="e5-vacio">Cargando…</div></div>';
  board.appendChild(sec);
  api.getContactos().then(function(r){
    var g=document.getElementById('e5-cont-grid'); if(!g) return;
    var cs=(r&&r.contactos)||[];
    if(!cs.length){ g.innerHTML='<div class="e5-vacio">Corre setupHojasE5() y llena la hoja CONTACTOS.</div>'; return; }
    g.innerHTML=cs.map(function(x){
      var tels=[x['Teléfono 1'],x['Teléfono 2'],x['Teléfono 3']].filter(Boolean)
        .map(function(t){return '<a href="tel:'+t+'">'+t+'</a>';}).join(' · ');
      return '<div class="e5-cont"><div class="n">'+(x['Nombre']||'')+' '+(x['Apellido']||'')+
        ' <span style="color:var(--hud-text-faint);font-size:10px">'+(x['ID']||'')+'</span></div>'+
        '<div class="a">'+(x['Afinidad']||'')+'</div>'+
        '<div class="d">'+tels+(x['Email']?'<br>'+x['Email']:'')+'</div></div>';
    }).join('');
  }).catch(function(){});
}
(function(){
  var espera=setInterval(function(){
    if(typeof window._montarSOS==='function' && !window._montarSOS.__e5){
      var base=window._montarSOS;
      window._montarSOS=function(){ base(); setTimeout(_e5Contactos,80); };
      window._montarSOS.__e5=true;
      clearInterval(espera);
    }
  },400);
  setTimeout(function(){clearInterval(espera);},15000);
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
console.log('[e5] activo · alcohol+lucy+contactos (api extendida: getContactos/getLucy/nuevaLucy/getAlcohol/nuevoAlcohol)');
})();
