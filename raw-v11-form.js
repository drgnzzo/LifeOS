/* LifeOS v11.3 — raw-v11-form.js (E3-D3)
   ═══════════════════════════════════════════════════════════════════
   EL FORM RAW — corazón de la captura. TODO rescatado VERBATIM:
   · api de escritura: raw-core.js:101-161 (extiende window.api de
     escena solo con los métodos que le faltan — jamás lo envuelve)
   · estado + campos + onCats + concepto + monto + guardar + limpiar:
     raw-core.js:167-171 y 392-670
   · toggle modo + tabs por tipo + forms + guardars + entes:
     raw-core.js:1244-2051
   · abrirFormulario / _aplicarDialPreset / cerrarEntrada:
     raw-overlay.js:8711-8820
   Sin IIFE a propósito: el markup usa onclick inline (v9) y las
   funciones deben ser globales, igual que en raw-core.
   Requiere: raw-escena.js antes (window.api, gasRun/apiGet/apiPost,
   EN_GAS) y el markup del form en index-v11.html.
   ═══════════════════════════════════════════════════════════════════ */

/* ── EXTENSIÓN DE API (verbatim; solo lo que escena no tiene) ── */
var _API_V9 = {
  getAll:               ()=>EN_GAS?gasRun('getAll'):apiGet('getAll'),
  getSaldoDia:          (f)=>EN_GAS?gasRun('getSaldoDia',f):apiGet('getSaldoDia',{fecha:f}),
  getListaEstructura:   ()=>EN_GAS?gasRun('getListaEstructura'):apiGet('getListaEstructura'),
  insertarEnRAW:        (d)=>EN_GAS?gasRun('insertarEnRAW',d):apiPost('insertarEnRAW',{data:d}),
  actualizarFijo:       (fila,monto)=>EN_GAS?gasRun('actualizarFijo',fila,monto):apiPost('actualizarFijo',{fila,monto}),
  agregarALista:        (colIndex,valor)=>EN_GAS?gasRun('agregarALista',colIndex,valor):apiPost('agregarALista',{colIndex,valor}),
  marcarLogro:          (fila,val)=>EN_GAS?gasRun('marcarLogro',fila,val):apiPost('marcarLogro',{fila,val}),
  getFijos:             ()=>EN_GAS?gasRun('getFijos'):apiGet('getFijos'),
  getDatosMes:          ()=>EN_GAS?gasRun('getDatosMes'):apiGet('getDatosMes'),
  getGastos:            ()=>EN_GAS?gasRun('getGastos'):apiGet('getGastos'),
  getLogros:            ()=>EN_GAS?gasRun('getLogros'):apiGet('getLogros'),
  getActivityCheck:     ()=>EN_GAS?gasRun('getActivityCheck'):apiGet('getActivityCheck'),
  cargarActivityChecks: (semana)=>EN_GAS?gasRun('cargarActivityChecks',semana):apiGet('cargarActivityChecks',{semana}),
  guardarActivityChecks:(semana,checks)=>EN_GAS?gasRun('guardarActivityChecks',semana,checks):apiPost('guardarActivityChecks',{semana,checks}),
  guardarEnBancos:      (nombre,monto,fecha)=>EN_GAS?gasRun('guardarEnBancos',nombre,monto,fecha):apiPost('guardarEnBancos',{nombre,monto,fecha}),
  getFilaPorId:         (id)=>EN_GAS?gasRun('getFilaPorId',id):apiGet('getFilaPorId',{id}),
  editarFilaRAW:        (fila,datos)=>EN_GAS?gasRun('editarFilaRAW',fila,datos):apiPost('editarFilaRAW',{fila,datos}),
  getPensamientos:      ()=>EN_GAS?gasRun('getPensamientos'):apiGet('getPensamientos'),
  guardarPensamiento:   (d)=>EN_GAS?gasRun('guardarPensamiento',d):apiPost('guardarPensamiento',{datos:d}),
  getRelaciones:        ()=>EN_GAS?gasRun('getRelaciones'):apiGet('getRelaciones'),
  guardarInteraccion:   (d)=>EN_GAS?gasRun('guardarInteraccion',d):apiPost('guardarInteraccion',{datos:d}),
  getSalud:             ()=>EN_GAS?gasRun('getSalud'):apiGet('getSalud'),
  guardarSalud:         (d)=>EN_GAS?gasRun('guardarSalud',d):apiPost('guardarSalud',{datos:d}),
  getApartados:         ()=>EN_GAS?gasRun('getApartados'):apiGet('getApartados'),
  guardarApartado:      (d)=>EN_GAS?gasRun('guardarApartado',d):apiPost('guardarApartado',{datos:d}),
  actualizarApartado:   (fila,estado)=>EN_GAS?gasRun('actualizarApartado',fila,estado):apiPost('actualizarApartado',{fila,estado}),
  getFinancieroAvanzado:()=>EN_GAS?gasRun('getFinancieroAvanzado'):apiGet('getFinancieroAvanzado'),
  getRevision:          (tipo,anio,mes,semana)=>EN_GAS?gasRun('getRevision',tipo,anio,mes,semana):apiGet('getRevision',{tipo,anio,mes,semana}),
  getNecesidades:       (anio,mes,fecha)=>EN_GAS?gasRun('getNecesidades',anio,mes,fecha):apiGet('getNecesidades',{anio,mes,fecha}),
  getFlujoPorMes:       ()=>EN_GAS?gasRun('getFlujoPorMes'):apiGet('getFlujoPorMes'),
  getScoreVida:         ()=>EN_GAS?gasRun('getScoreVida'):apiGet('getScoreVida'),
  enviarSOS:            (d)=>EN_GAS?gasRun('enviarSOS',d):apiPost('enviarSOS',{datos:d}),
  getPatrimonio:        ()=>EN_GAS?gasRun('getPatrimonio'):apiGet('getPatrimonio'),
  getAhorro:            ()=>EN_GAS?gasRun('getAhorro'):apiGet('getAhorro'),
  getEfectivo:          ()=>EN_GAS?gasRun('getEfectivo'):apiGet('getEfectivo'),
  getInversion:         ()=>EN_GAS?gasRun('getInversion'):apiGet('getInversion'),
  guardarAhorro:        (d)=>EN_GAS?gasRun('guardarAhorro',d):apiPost('guardarAhorro',{datos:d}),
  guardarEfectivo:      (d)=>EN_GAS?gasRun('guardarEfectivo',d):apiPost('guardarEfectivo',{datos:d}),
  guardarInversion:     (d)=>EN_GAS?gasRun('guardarInversion',d):apiPost('guardarInversion',{datos:d}),
  setActivityCheck:     (tipo,fila,dia,valor)=>EN_GAS?gasRun('setActivityCheck',tipo,fila,dia,valor):apiPost('setActivityCheck',{tipo,fila,dia,valor}),
  marcarActivityItem:   (tipo,fila,valor)=>EN_GAS?gasRun('marcarActivityItem',tipo,fila,valor):apiPost('marcarActivityItem',{tipo,fila,valor}),
  agregarAActivity:     (tipo,datos)=>EN_GAS?gasRun('agregarAActivity',tipo,datos):apiPost('agregarAActivity',{tipo,datos}),
  resetearElectronics:  ()=>EN_GAS?gasRun('resetearElectronicsHoy'):apiGet('resetearElectronics'),
  getNutricion:         ()=>EN_GAS?gasRun('getNutricion'):apiGet('getNutricion'),
  getMetasNutricion:    ()=>EN_GAS?gasRun('getMetasNutricion'):apiGet('getMetasNutricion'),
  guardarNutricion:     (d)=>EN_GAS?gasRun('guardarNutricion',d):apiPost('guardarNutricion',{datos:d}),
  getEntrenamiento:     ()=>EN_GAS?gasRun('getEntrenamiento'):apiGet('getEntrenamiento'),
  guardarEntrenamiento: (d)=>EN_GAS?gasRun('guardarEntrenamiento',d):apiPost('guardarEntrenamiento',{datos:d}),
  // v6.069 — NOTAS (sticky notes). Hoja NOTAS del Sheet.
  getNotas:             ()=>EN_GAS?gasRun('getNotas'):apiGet('getNotas'),
  guardarNota:          (d)=>EN_GAS?gasRun('guardarNota',d):apiPost('guardarNota',{datos:d}),
  actualizarNota:       (d)=>EN_GAS?gasRun('actualizarNota',d):apiPost('actualizarNota',{datos:d}),
  borrarNota:           (id)=>EN_GAS?gasRun('borrarNota',id):apiPost('borrarNota',{id:id}),
  moverNota:            (id,slot)=>EN_GAS?gasRun('moverNota',id,slot):apiPost('moverNota',{id:id,slot:slot}),
  // v8.5 — Timers (cronómetros). Backend: getTimers / crearTimer / actualizarTimer.
  getTimers:            ()=>EN_GAS?gasRun('getTimers'):apiGet('getTimers'),
  crearTimer:           (datos)=>EN_GAS?gasRun('crearTimer',datos):apiPost('crearTimer',{datos:datos}),
  actualizarTimer:      (clave,campos)=>EN_GAS?gasRun('actualizarTimer',clave,campos):apiPost('actualizarTimer',{clave:clave,campos:campos}),
};
// v8.5 — Exponer api en window para módulos cargados aparte (p.ej. raw-timers).
Object.keys(_API_V9).forEach(function(k){ if(!window.api[k]) window.api[k]=_API_V9[k]; });

/* ── ESTADO DEL FORM (verbatim raw-core.js:167-171) ── */
const CAMPOS=['fecha','proyecto','contacto','concepto','monto','recurrencia','necesidad','clave'];
const MESES_ES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
let sign=1,cats={},proxSel='',contactoSel='',recSel='',necesidadSel='',sheetUrl='';
let _modoEditar=false,_filaEditar=null,_idEditar=null;
let _tabEntrada='nueva';

/* ── HELPERS + CAMPOS + GUARDAR (verbatim raw-core.js:392-670) ── */
function mostrarErrorConexion(msg){
  const d=document.createElement('div');
  d.style.cssText='position:fixed;top:60px;left:8px;right:8px;z-index:9999;background:#EF4444;color:#fff;padding:12px 16px;border-radius:12px;font-size:13px;font-weight:600';
  d.innerHTML='⚠ <b>Error de conexión:</b> '+msg;
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),10000);
}

// ══════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════
function fmtD(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function fmtDiaSemana(str){
  if(!str)return'';
  const DIAS=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const p=str.split('-'); if(p.length!==3)return str;
  const d=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));
  return DIAS[d.getDay()]+' '+p[2]+'/'+p[1];
}
function fmtMoneda(v){
  if(v===null||v===undefined||v==='')return{txt:'—',cls:'z'};
  const n=Number(v); if(isNaN(n))return{txt:'—',cls:'z'};
  if(n===0)return{txt:'$ 0',cls:'z'};
  const abs='$ '+Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
  return n>0?{txt:abs,cls:'pos'}:{txt:'− '+abs,cls:'neg'};
}
function setChip(t,txt){
  ['chip','chip2'].forEach(id=>{ const c=document.getElementById(id); if(c)c.className='hero-chip '+t; });
  ['chip-txt','chip-txt2'].forEach(id=>{ const ct=document.getElementById(id); if(ct)ct.textContent=txt; });
}
function showToast(msg,ok=true){
  const t=document.getElementById('toast');
  t.className='toast '+(ok?'ok':'err');
  t.querySelector('i').className=ok?'fas fa-circle-check':'fas fa-circle-xmark';
  document.getElementById('toast-msg').textContent=msg;
  t.classList.add('show');
  clearTimeout(_toast);
  _toast=setTimeout(()=>t.classList.remove('show'),2800);
}
// v6.040: el elemento #prog (barra de progreso vieja del hero) fue
// retirado al rediseñar la barra superior en v6.010. progStart/progDone
// se vuelven a prueba de null para no lanzar TypeError — el feedback de
// "actualizando" ahora lo da el botón girando + el chip de estado.
function progStart(){const b=document.getElementById('prog');if(b)b.className='prog-bar ind';}
function progDone(){const b=document.getElementById('prog');if(!b)return;b.className='prog-bar';b.style.width='100%';setTimeout(()=>{b.style.width='0%';},400);}

// ══════════════════════════════════════════
//  ACORDEONES
// ══════════════════════════════════════════
function togKard(id){
  const el=document.getElementById(id);if(!el)return;
  const isOpen=(el.style.display!=='none' && el.style.display!=='');
  // v8.17 — fade suave al desplegar/colapsar el detalle (antes era de golpe).
  if(window.RawAnim){
    if(isOpen) window.RawAnim.ocultar(el,{dur:0.18,y:4});
    else       window.RawAnim.mostrar(el,{dur:0.22,y:4,display:'block'});
  } else {
    el.style.display=isOpen?'none':'block';
  }
}
function togSec(hdr){
  const isMob=document.documentElement.classList.contains('mob'); if(!isMob)return;
  const bodyId=hdr.id.replace('-hdr','-body');
  const body=document.getElementById(bodyId);
  const isOpen=body.classList.contains('open');
  body.classList.toggle('open',!isOpen);
  hdr.classList.toggle('open',!isOpen);
}

// ══════════════════════════════════════════
//  CAMPOS NUEVA ENTRADA
// ══════════════════════════════════════════
function activarCampo(id){
  CAMPOS.forEach(f=>{ const el=document.getElementById('cf-'+f); if(el)el.classList.remove('active'); });
  const el=document.getElementById('cf-'+id);
  if(el){ el.classList.add('active'); setTimeout(()=>{ const inp=el.querySelector('input:not([readonly])'); if(inp&&inp.type!=='date')inp.focus(); },50); }
}
function avanzarA(id){ const idx=CAMPOS.indexOf(id); if(idx<CAMPOS.length-1)activarCampo(CAMPOS[idx+1]); }
function marcarDone(id){ const el=document.getElementById('cf-'+id); if(el)el.classList.add('done'); }
function setFieldVal(id,val,empty=false){ const el=document.getElementById('cv-'+id);if(!el)return;el.textContent=val;el.classList.toggle('empty',empty); }
function onFechaChange(){ const v=document.getElementById('fecha').value; marcarDone('fecha'); }
function onClaveChange(){ const v=document.getElementById('clave').value.trim(); setFieldVal('clave',v||'Opcional',!v); }

// ══════════════════════════════════════════
//  CATÁLOGOS
// ══════════════════════════════════════════
function onCats(d){
  cats=d;
  buildOpts('sw-proyecto',d.proyectos,v=>{proxSel=v;setFieldVal('proyecto',v);marcarDone('proyecto');avanzarA('proyecto');});
  buildOpts('sw-contacto',d.contactos,v=>{contactoSel=v;setFieldVal('contacto',v);marcarDone('contacto');avanzarA('contacto');});
  buildOpts('sw-recurrencia',d.recurrencias,v=>{recSel=v;setFieldVal('recurrencia',v);marcarDone('recurrencia');avanzarA('recurrencia');});
  if(d.necesidades&&d.necesidades.length){ buildOptsNecesidad('sw-necesidad',d.necesidades,v=>{necesidadSel=v;setFieldVal('necesidad',v.slice(0,30)+'…');marcarDone('necesidad');avanzarA('necesidad');}); }
  setChip('ok','Listo');
  var chipEl=document.getElementById('chip');
  if(chipEl&&!chipEl._refreshBound){
    chipEl._refreshBound=true; chipEl.style.cursor='pointer'; chipEl.title='Click para actualizar';
    chipEl.addEventListener('click',function(){
      _actData=null; setChip('load','Cargando');
      api.getAll().then(function(d){
        if(!d.ok&&!d.catalogos){ setChip('err','Error'); return; }
        sheetUrl=d.sheetUrl||''; onCats(d.catalogos);
        if(typeof renderApartados==='function') renderApartados(d.apartados||{items:[],totalApartado:0});
        if(typeof renderEntes==='function') renderEntes(d.fijos);
        if(typeof onDatosMes==='function') onDatosMes(d.datosMes);
        if(typeof renderAnualidad==='function') renderAnualidad(d.gastos);
        if(typeof renderLogros==='function') renderLogros(d.logros);
        if(typeof renderNecesidades==='function') renderNecesidades(d.necesidades);
        if(typeof renderNecesidadesInline==='function'){ renderNecesidadesInline(d.necesidades); setTimeout(function(){ if(typeof actualizarNecInline==='function') actualizarNecInline(); },50); }
        if(typeof renderFlujoMensual==='function') renderFlujoMensual(d.flujoPorMes);
        if(d.activityCheck){ _actData=d.activityCheck; if(typeof renderActivity==='function'&&_pantalla==='activity') renderActivity(); }
        if(typeof renderFinancieroAvanzado==='function'&&d.financieroAvanzado) renderFinancieroAvanzado(d.financieroAvanzado);
        if(d.pensamientos){ window._pensamientosData=d.pensamientos; }
        if(d.relaciones){   window._relacionesData=d.relaciones; }
        if(d.salud){        window._saludData=d.salud; }
        if(d.nutricion){    window._nutData=d.nutricion; }
        if(d.entrenamiento){window._entData=d.entrenamiento; }
        if(d.patrimonio){   window._patrimonioData=d.patrimonio; }
        if(d.financieroAvanzado){ window._finData=d.financieroAvanzado; }
        setChip('ok','Listo ↺'); showToast('✓ Datos actualizados');
        if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();
      }).catch(function(){ setChip('err','Error'); });
    });
  }
}
function buildOptsNecesidad(id,items,cb){
  const w=document.getElementById(id);if(!w)return;w.innerHTML='';
  const COLORES=['#3B82F6','#4ADE80','#F59E0B','#EC4899','#8B5CF6'];
  items.forEach((it,i)=>{
    const b=document.createElement('button');b.className='opt';
    const m=it.match(/^(\d+)\.\s+(\w+)/);
    b.textContent=m?m[1]+'. '+m[2]:it.slice(0,20); b.title=it;
    b.style.borderColor=COLORES[i%5]+'44';
    b.onclick=e=>{e.stopPropagation();w.querySelectorAll('.opt').forEach(x=>x.classList.remove('on'));b.classList.add('on');cb(it);};
    w.appendChild(b);
  });
}
function buildOpts(id,items,cb){
  const w=document.getElementById(id);if(!w)return;w.innerHTML='';
  items.forEach(it=>{
    const b=document.createElement('button');b.className='opt';b.textContent=it;
    b.onclick=e=>{e.stopPropagation();w.querySelectorAll('.opt').forEach(x=>x.classList.remove('on'));b.classList.add('on');cb(it);};
    w.appendChild(b);
  });
}

// ══════════════════════════════════════════
//  POPUP CONCEPTO
// ══════════════════════════════════════════
function abrirConcepto(){ activarCampo('concepto'); renderConceptoPopup(''); document.getElementById('popup-concepto').classList.add('show'); setTimeout(()=>document.getElementById('pop-search').focus(),80); }
function cerrarConcepto(e){ if(e&&e.target!==document.getElementById('popup-concepto'))return; document.getElementById('popup-concepto').classList.remove('show'); document.getElementById('pop-search').value=''; }
function filtrarConcepto(){ renderConceptoPopup(document.getElementById('pop-search').value); }
function renderConceptoPopup(q){
  const items=(cats.conceptos||[]).filter(i=>!q||i.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
  const body=document.getElementById('pop-body');
  if(!items.length){body.innerHTML='<div style="text-align:center;padding:24px;color:var(--m)">Sin resultados</div>';return;}
  const actual=document.getElementById('cv-concepto').classList.contains('empty')?'':document.getElementById('cv-concepto').textContent.trim();
  const grupos={};
  items.forEach(it=>{const l=it[0].toUpperCase().replace(/[^A-Z0-9]/,'#');if(!grupos[l])grupos[l]=[];grupos[l].push(it);});
  body.innerHTML=Object.keys(grupos).sort().map(l=>`<div class="pop-grupo-lbl">${l}</div><div class="pop-items">${grupos[l].map(it=>`<div class="pop-item${it===actual?' on':''}" onclick="selConcepto('${it.replace(/'/g,"\\'")}')">${it}</div>`).join('')}</div>`).join('');
}
function selConcepto(val){ setFieldVal('concepto',val);marcarDone('concepto'); document.getElementById('popup-concepto').classList.remove('show'); document.getElementById('pop-search').value=''; avanzarA('concepto'); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.getElementById('popup-concepto').classList.remove('show'); });

// ══════════════════════════════════════════
//  MONTO
// ══════════════════════════════════════════
function setSign(s){ sign=s; document.getElementById('sbp').className='msign'+(s===1?' pos':''); document.getElementById('sbn').className='msign'+(s===-1?' neg':''); upM(); }
function upM(){
  const v=(parseFloat(document.getElementById('monto').value)||0)*sign;
  const {txt,cls}=fmtMoneda(v||null);
  document.getElementById('mprev').textContent=v===0?'$ 0.00':txt;
  document.getElementById('mprev').className='mprev'+(v>0?' pos':v<0?' neg':'');
  setFieldVal('monto',v===0?'$ 0.00':txt,v===0);
  if(v!==0)marcarDone('monto');
}

// ══════════════════════════════════════════
//  SALDO
// ══════════════════════════════════════════
// v6.073 — COMPUERTA DE ARRANQUE.
// Apps Script encola las peticiones del mismo usuario en SERIE: las
// ~8 llamadas GET del arranque (necesidades, revision, nutricion,
// flujo, saldo, notas...) se formaban delante o alrededor de getAll
// y nada pintaba hasta que toda la fila avanzara (20s+).
// Esta compuerta DIFIERE todas las lecturas secundarias hasta que la
// PRIMERA getAll resuelva: arranque = getAll solo (~2s con cache
// caliente), las cards pintan, el resto llena sus paneles despues.
// Escrituras NO se difieren. Salvavidas a 12s.
(function(){
  var DIFERIR = ['getNecesidades','getRevision','getNutricion','getFlujoPorMes',
                 'getNotas','getScoreVida','getSaldoDia','getPensamientos',
                 'getRelaciones','getSalud','getPatrimonio','getApartados',
                 'getFinancieroAvanzado','getActivityCheck','getLogros',
                 'getFijos','getGastos','getDatosMes','getEntrenamiento',
                 'getMetasNutricion','getEventuales','getAhorro','getEfectivo',
                 'getInversion'];
  var _gateAbierta = false;
  var _gateRes;
  var _gate = new Promise(function(res){ _gateRes = res; });
  function abrirGate(){ if(!_gateAbierta){ _gateAbierta = true; _gateRes(); } }
  var origGetAll = api.getAll;
  api.getAll = function(){
    var p = origGetAll.apply(this, arguments);
    if(p && typeof p.then === 'function') p.then(abrirGate, abrirGate);
    return p;
  };
  setTimeout(abrirGate, 12000);
  DIFERIR.forEach(function(fn){
    var orig = api[fn];
    if(typeof orig !== 'function') return;
    api[fn] = function(){
      var args = arguments, self = this;
      if(_gateAbierta) return orig.apply(self, args);
      return _gate.then(function(){ return orig.apply(self, args); });
    };
  });
})();

function consultarSaldo(){
  const fechaEl=document.getElementById('saldo-fecha');
  const f=fechaEl?fechaEl.value:'';
  if(!f) return Promise.resolve();
  const el=document.getElementById('saldo-val');
  if(el){el.className='saldo-val ld';el.textContent='…';}
  return api.getSaldoDia(f).then(r=>{
    if(el){el.textContent=r.display;el.className='saldo-val '+(r.valor>0?'pos':r.valor<0?'neg':'')+' updated';setTimeout(function(){el.classList.remove('updated');},500);}
  }).catch(()=>{if(el){el.className='saldo-val ld';el.textContent='—';}});
}

// ══════════════════════════════════════════
//  GUARDAR
// ══════════════════════════════════════════
function guardar(){
  const fecha=document.getElementById('fecha').value;
  const concepto=document.getElementById('cv-concepto').classList.contains('empty')?'':document.getElementById('cv-concepto').textContent.trim();
  const monto=(parseFloat(document.getElementById('monto').value)||0)*sign;
  if(_modoEditar){
    if(!_filaEditar){mostrarRes(false,'Busca un ID primero');return;}
  } else {
    const errs=[];
    if(!fecha)errs.push('Fecha');if(!proxSel)errs.push('Proyecto');if(!contactoSel)errs.push('Contacto');
    if(!concepto)errs.push('Concepto');if(monto===0)errs.push('Monto');if(!recSel)errs.push('Recurrencia');
    if(errs.length){ mostrarRes(false,'Faltan: '+errs.join(', ')); return; }
  }
  ocultarRes();progStart();setBtn(true);
  const claveVal=document.getElementById('clave').value.trim();
  const payload={fecha,proyecto:proxSel,contacto:contactoSel,concepto,monto,recurrencia:recSel,necesidad:necesidadSel,clave:claveVal};
  const promesa=_modoEditar&&_filaEditar?api.editarFilaRAW(_filaEditar,payload):api.insertarEnRAW(payload);
  promesa.then(r=>{
    progDone();setBtn(false);mostrarRes(r.ok,r.mensaje);showToast(r.ok?'✓ Guardado':'Error al guardar',r.ok);
    if(r.ok){ limpiar(false);consultarSaldo();api.getFijos().then(renderEntes);api.getGastos().then(renderAnualidad);api.getDatosMes().then(onDatosMes);setTimeout(cerrarEntrada,800); }
  }).catch(e=>{progDone();setBtn(false);mostrarRes(false,'Error: '+e.message);showToast('Error',false);});
}
function setBtn(l){ const b=document.getElementById('btnG');if(b)b.disabled=l;const sp=document.getElementById('spin');if(sp)sp.style.display=l?'block':'none';const bi=document.getElementById('bico');if(bi)bi.style.display=l?'none':'inline'; }
function mostrarRes(ok,msg){
  // v8.41 — onda cósmica: el cosmos responde cuando guardas con éxito.
  if(ok && typeof window._ondaCosmica === 'function') window._ondaCosmica('#4ADE80');
  const el=document.getElementById('save-res');document.getElementById('res-ico').textContent=ok?'✓':'✗';document.getElementById('res-msg').textContent=msg;el.className='save-res '+(ok?'ok':'err'); }
function ocultarRes(){ document.getElementById('save-res').className='save-res'; }
function limpiar(rf=true){
  if(rf){const fEl=document.getElementById('fecha');if(fEl)fEl.value=fmtD(new Date());}
  ['proyecto','contacto','recurrencia'].forEach(k=>{document.querySelectorAll(`#sw-${k} .opt`).forEach(b=>b.classList.remove('on'));setFieldVal(k,'',true);});
  proxSel='';contactoSel='';recSel='';necesidadSel='';
  document.querySelectorAll('#sw-necesidad .opt').forEach(b=>b.classList.remove('on'));setFieldVal('necesidad','',true);
  document.getElementById('monto').value='';document.getElementById('clave').value='';
  setFieldVal('concepto','',true);setFieldVal('monto','$ 0.00',true);setFieldVal('clave','',true);
  CAMPOS.forEach(f=>{const e=document.getElementById('cf-'+f);if(e)e.classList.remove('done');});
  setSign(1);upM();ocultarRes();activarCampo('fecha');
}
function irASheet(){ var url=sheetUrl||'https://docs.google.com/spreadsheets/d/15T14Hb7tvmv24ZAaC3su1NRtDwVS6-dWbJGxQYUGP1o/edit';window.open(url,'_blank'); }

// ══════════════════════════════════════════
//  SHEETS EMBED
// ══════════════════════════════════════════
const SHEETS_CONFIG=[{id:'raw',label:'RAW',emoji:'📄',gid:'0',spreadsheetId:'15T14Hb7tvmv24ZAaC3su1NRtDwVS6-dWbJGxQYUGP1o'}];

/* ═══════════════════════════════════════════════════════
   NAVEGACIÓN
═══════════════════════════════════════════════════════ */

/* ── TOGGLE MODO + TABS POR TIPO + FORMS (verbatim 1244-2051) ── */
function _inyectarToggleModo(){
  if(document.getElementById('toggle-modo-wrap'))return;
  if(!document.getElementById('form-hud-styles')){
    var fs = document.createElement('style');
    fs.id = 'form-hud-styles';
    fs.textContent = [
      '@keyframes formBreath{',
        '0%,100%{box-shadow:0 0 0 1px rgba(140,100,220,0.20),0 0 30px rgba(139,92,246,0.12),0 0 60px rgba(139,92,246,0.06),0 24px 80px rgba(0,0,0,0.85);}',
        '33%{box-shadow:0 0 0 1px rgba(167,139,250,0.45),0 0 40px rgba(139,92,246,0.30),0 0 80px rgba(139,92,246,0.14),0 24px 80px rgba(0,0,0,0.90);}',
        '66%{box-shadow:0 0 0 1px rgba(34,211,238,0.30),0 0 35px rgba(34,211,238,0.18),0 0 70px rgba(34,211,238,0.08),0 24px 80px rgba(0,0,0,0.90);}',
      '}',
      '@keyframes formBorderGlow{',
        '0%,100%{background:linear-gradient(90deg,#7C3AED,#A855F7,#22D3EE);box-shadow:0 0 12px rgba(139,92,246,0.7),0 0 24px rgba(139,92,246,0.3);}',
        '33%{background:linear-gradient(90deg,#A855F7,#22D3EE,#4ADE80);box-shadow:0 0 12px rgba(34,211,238,0.7),0 0 24px rgba(34,211,238,0.3);}',
        '66%{background:linear-gradient(90deg,#22D3EE,#7C3AED,#A855F7);box-shadow:0 0 12px rgba(167,139,250,0.7),0 0 24px rgba(167,139,250,0.3);}',
      '}',
      '@keyframes formScan{0%{top:-2px;opacity:0}3%{opacity:0.6}97%{opacity:0.6}100%{top:100%;opacity:0}}',
      '#sec-entrada{background:rgba(10,7,22,0.97)!important;border:1px solid rgba(140,100,220,0.25)!important;border-radius:16px!important;backdrop-filter:blur(28px) saturate(180%)!important;-webkit-backdrop-filter:blur(28px) saturate(180%)!important;background-image:linear-gradient(rgba(120,80,200,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,200,0.018) 1px,transparent 1px)!important;background-size:32px 32px!important;width:440px!important;max-width:96vw!important;animation:formBreath 4s ease-in-out infinite!important;position:relative!important;overflow:hidden!important;}',
      '#sec-entrada::after{content:"";position:absolute;left:0;right:0;height:2px;pointer-events:none;z-index:10;background:linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.4),transparent);animation:formScan 6s linear infinite;}',
      '#entrada-paso2-header{display:flex;align-items:center;gap:12px;padding:16px 20px 14px;border-bottom:1px solid rgba(140,100,220,0.18);background:rgba(18,10,36,0.8);position:relative;overflow:hidden;}',
      '#entrada-paso2-header::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;animation:formBorderGlow 4s ease-in-out infinite;}',
      '#entrada-paso2-titulo{font-size:14px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#C4B5FD;text-shadow:0 0 12px rgba(139,92,246,0.5);flex:1;}',
      '#toggle-modo-wrap{display:flex;gap:2px;padding:10px 16px 0;border-bottom:1px solid rgba(140,100,220,0.12);background:rgba(10,6,22,0.5);overflow-x:auto;}',
      '#toggle-modo-wrap::-webkit-scrollbar{display:none}',
      '.tab-entrada{padding:6px 12px;border:none;border-radius:8px 8px 0 0;background:transparent;color:rgba(200,208,230,0.40);font-family:inherit;font-size:11px;font-weight:600;letter-spacing:.06em;cursor:pointer;transition:all .15s;white-space:nowrap;border-bottom:2px solid transparent;}',
      '.tab-entrada:hover{color:rgba(200,208,230,0.75);background:rgba(139,92,246,0.08);}',
      '.tab-entrada.on{color:#C4B5FD;border-bottom-color:#A855F7;background:rgba(139,92,246,0.12);text-shadow:0 0 8px rgba(139,92,246,0.4);}',
      '.fwrap{padding:16px 20px;display:flex;flex-direction:column;gap:12px;}',
      '.flbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.16em;color:rgba(167,139,250,0.55);margin-bottom:5px;}',
      '.fi{width:100%;box-sizing:border-box;background:rgba(20,12,40,0.7);border:1px solid rgba(140,100,220,0.22);border-radius:10px;color:#E2E8F0;font-family:inherit;font-size:14px;padding:11px 14px;outline:none;transition:border-color .15s,box-shadow .15s;-webkit-appearance:none;}',
      '.fi:focus{border-color:rgba(167,139,250,0.55);box-shadow:0 0 0 3px rgba(139,92,246,0.12),inset 0 0 12px rgba(139,92,246,0.04);}',
      '.fi::placeholder{color:rgba(200,208,230,0.22);}',
      '.fo{display:flex;flex-wrap:wrap;gap:6px;}',
      '.fopt{padding:6px 13px;border-radius:8px;background:rgba(20,12,40,0.6);border:1px solid rgba(140,100,220,0.20);color:rgba(200,208,230,0.55);font-family:inherit;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;letter-spacing:.04em;}',
      '.fopt:hover{border-color:rgba(167,139,250,0.45);color:rgba(220,220,240,0.85);background:rgba(139,92,246,0.10);}',
      '.fopt.on{background:rgba(139,92,246,0.22);border-color:rgba(167,139,250,0.55);color:#C4B5FD;box-shadow:0 0 8px rgba(139,92,246,0.20);text-shadow:0 0 6px rgba(167,139,250,0.4);}',
      '.fguardar{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 20px;border:none;border-radius:10px;background:linear-gradient(135deg,rgba(109,40,217,0.9),rgba(139,92,246,0.85));border:1px solid rgba(167,139,250,0.4);color:#fff;font-family:inherit;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;width:100%;box-shadow:0 4px 20px rgba(139,92,246,0.3);transition:all .15s;}',
      '.fguardar:hover{background:linear-gradient(135deg,rgba(124,58,237,1),rgba(167,139,250,0.9));box-shadow:0 4px 28px rgba(139,92,246,0.5);transform:translateY(-1px);}',
      '.fguardar:active{transform:translateY(0);}',
      '.fg2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.fg3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}',
      '.fres{font-size:12px;text-align:center;min-height:18px;color:rgba(200,208,230,0.4);}',
      '.fres.ok{color:#4ADE80;text-shadow:0 0 8px rgba(74,222,128,0.4);}',
      '.fres.err{color:#EF4444;}',
      '.fdiv{height:1px;background:linear-gradient(90deg,rgba(139,92,246,0.25),rgba(139,92,246,0.05));margin:2px 0;}',
      '.form-actions{padding:12px 20px 16px!important;border-top:1px solid rgba(140,100,220,0.12)!important;background:rgba(8,4,18,0.5)!important;gap:8px!important;}',
      '#btnG{background:linear-gradient(135deg,rgba(109,40,217,0.9),rgba(139,92,246,0.85))!important;border:1px solid rgba(167,139,250,0.4)!important;box-shadow:0 4px 20px rgba(139,92,246,0.3)!important;border-radius:10px!important;color:#fff!important;font-weight:700!important;letter-spacing:.06em!important;}',
      '#btnG:hover{box-shadow:0 4px 28px rgba(139,92,246,0.5)!important;transform:translateY(-1px)!important;}',
      '.campo-field,.finput{background:rgba(20,12,40,0.7)!important;border:1px solid rgba(140,100,220,0.22)!important;border-radius:10px!important;color:#E2E8F0!important;}',
      '.campo-field:focus,.finput:focus{border-color:rgba(167,139,250,0.55)!important;box-shadow:0 0 0 3px rgba(139,92,246,0.12)!important;outline:none!important;}',
      '.campo-label,.campo-lbl{color:rgba(167,139,250,0.55)!important;font-size:9px!important;font-weight:700!important;letter-spacing:.16em!important;text-transform:uppercase!important;}',
      '.opts{display:flex;flex-wrap:wrap;gap:5px!important;}',
      '.opt{background:rgba(20,12,40,0.6)!important;border:1px solid rgba(140,100,220,0.20)!important;border-radius:8px!important;color:rgba(200,208,230,0.55)!important;font-size:11px!important;font-weight:600!important;padding:6px 12px!important;transition:all .15s!important;}',
      '.opt:hover{border-color:rgba(167,139,250,0.45)!important;color:rgba(220,220,240,0.9)!important;background:rgba(139,92,246,0.10)!important;}',
      '.opt.on{background:rgba(139,92,246,0.22)!important;border-color:rgba(167,139,250,0.55)!important;color:#C4B5FD!important;box-shadow:0 0 8px rgba(139,92,246,0.20)!important;}',
      '#sec-entrada::-webkit-scrollbar{width:4px;}',
      '#sec-entrada::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.3);border-radius:2px;}',
      '#btn-cerrar-entrada,#btnCerrar{background:rgba(30,15,50,0.7)!important;border:1px solid rgba(140,100,220,0.25)!important;border-radius:8px!important;color:rgba(167,139,250,0.7)!important;transition:all .15s!important;}',
      '#btn-cerrar-entrada:hover,#btnCerrar:hover{color:#fff!important;border-color:rgba(167,139,250,0.5)!important;background:rgba(139,92,246,0.15)!important;}',
    ].join('');
    document.head.appendChild(fs);
  }
  const wrap=document.createElement('div');
  wrap.id='toggle-modo-wrap';
  wrap.innerHTML=`
    <button id="btn-tab-nueva"          onclick="setModoEntrada('nueva')"          class="tab-entrada on">+ Nueva</button>
    <button id="btn-tab-editar"         onclick="setModoEntrada('editar')"         class="tab-entrada">✏ Editar</button>
    <button id="btn-tab-pensamiento"    onclick="setModoEntrada('pensamiento')"    class="tab-entrada">💭</button>
    <button id="btn-tab-persona"        onclick="setModoEntrada('persona')"        class="tab-entrada">👥</button>
    <button id="btn-tab-salud"          onclick="setModoEntrada('salud')"          class="tab-entrada">🏥</button>
    <button id="btn-tab-apartado"       onclick="setModoEntrada('apartado')"       class="tab-entrada">💰</button>
    <button id="btn-tab-patrimonio"     onclick="setModoEntrada('patrimonio')"     class="tab-entrada">🏦</button>
    <button id="btn-tab-nutricion"      onclick="setModoEntrada('nutricion')"      class="tab-entrada">🥗</button>
    <button id="btn-tab-entrenamiento"  onclick="setModoEntrada('entrenamiento')"  class="tab-entrada">💪</button>
    <button id="btn-tab-activity"       onclick="setModoEntrada('activity')"       class="tab-entrada">⚡</button>`;
  const body=document.getElementById('sec-entrada-body')||document.getElementById('entrada-paso2')||document.getElementById('wrap-entrada');
  if(body) body.insertBefore(wrap,body.firstChild);

  const idWrap=document.createElement('div');
  idWrap.id='editar-id-wrap'; idWrap.style.cssText='display:none;padding:12px var(--pad) 0;';
  idWrap.innerHTML=`<div style="display:flex;align-items:center;gap:8px"><input type="number" id="editar-id-input" class="finput" placeholder="ID de la fila" onkeydown="if(event.key==='Enter') buscarFilaId()"><button onclick="buscarFilaId()" class="btn-save" style="flex-shrink:0;padding:10px 18px;font-size:13px;border-radius:999px;min-width:80px"><span id="buscar-spin" class="spin-sm" style="display:none"></span>Buscar</button></div><div id="editar-id-msg" style="font-size:11px;margin-top:6px;color:var(--m)"></div>`;
  if(body) body.insertBefore(idWrap,wrap.nextSibling);

  ['pensamiento','persona','salud','apartado','patrimonio','bancos','nutricion','entrenamiento','activity','libro','movie','norut'].forEach(tab=>{
    const tw=document.createElement('div'); tw.id=tab+'-wrap'; tw.style.display='none';
    if(body) body.insertBefore(tw,idWrap.nextSibling);
  });
}

function setModoEntrada(modo){
  _tabEntrada=modo; _modoEditar=(modo==='editar');
  const paso1=document.getElementById('entrada-paso1');
  const paso2=document.getElementById('entrada-paso2');
  if(paso1) paso1.style.display='none';
  if(paso2) paso2.style.display='block';

  const titulos={nueva:'💸 RAW',editar:'✏️ Editar',pensamiento:'💭 Pensamiento',persona:'👥 Persona',salud:'🏥 Salud',apartado:'💰 Apartado',patrimonio:'🏦 Patrimonio',bancos:'🏛️ Bancos',nutricion:'🥗 Nutrición',entrenamiento:'💪 Entrenamiento',activity:'⚡ Activity',libro:'📚 Libro',movie:'🎬 Movie',norut:'📌 Pendiente'};
  const tituloEl=document.getElementById('entrada-paso2-titulo');
  if(tituloEl) tituloEl.textContent=titulos[modo]||modo;

  ['nueva','editar','pensamiento','persona','salud','apartado','patrimonio','bancos','nutricion','entrenamiento','libro','movie','norut','activity'].forEach(t=>{
    const btn=document.getElementById('btn-tab-'+t); if(btn)btn.classList.toggle('on',t===modo);
    const w=document.getElementById(t+'-wrap'); if(w)w.innerHTML='';
  });

  ['editar-id-wrap','pensamiento-wrap','persona-wrap','salud-wrap','apartado-wrap','patrimonio-wrap','bancos-wrap','nutricion-wrap','entrenamiento-wrap','activity-wrap','libro-wrap','movie-wrap','norut-wrap'].forEach(id=>{ const el=document.getElementById(id);if(el)el.style.display='none'; });

  const formActions=document.querySelector('.form-actions');
  if(modo==='nueva'){
    _mostrarCamposBase(true); if(formActions)formActions.style.display='flex';
    const btnG=document.getElementById('btnG'); if(btnG)btnG.innerHTML='<div class="spin-sm" id="spin"></div><i class="fas fa-floppy-disk" id="bico"></i> Guardar';
    _filaEditar=null;_idEditar=null; limpiar(true);
  } else if(modo==='editar'){
    _mostrarCamposBase(true); if(formActions)formActions.style.display='flex';
    const idWrap=document.getElementById('editar-id-wrap'); if(idWrap)idWrap.style.display='block';
    const btnG=document.getElementById('btnG'); if(btnG)btnG.innerHTML='<div class="spin-sm" id="spin"></div><i class="fas fa-pen" id="bico"></i> Actualizar';
    limpiar(false);
  } else {
    _mostrarCamposBase(false); if(formActions)formActions.style.display='none';
    const wrap=document.getElementById(modo+'-wrap');
    if(wrap){
      // v8.17 — fade al aparecer los campos del tipo (antes de golpe).
      if(window.RawAnim) window.RawAnim.mostrar(wrap,{dur:0.22,y:6,display:'block'});
      else wrap.style.display='block';
    }
    _renderTabEntrada(modo);
  }
}

function _mostrarCamposBase(visible){
  ['cf-fecha','cf-proyecto','cf-contacto','cf-concepto','cf-monto','cf-recurrencia','cf-necesidad','cf-clave'].forEach(id=>{ const el=document.getElementById(id);if(el)el.style.display=visible?'':'none'; });
  const saveRes=document.getElementById('save-res'); if(saveRes&&!visible)saveRes.className='save-res';
}

function _renderTabEntrada(tab){
  const wrap=document.getElementById(tab+'-wrap'); if(!wrap)return;
  wrap.innerHTML='';
  if(tab==='pensamiento')        _renderPensamientoForm(wrap);
  else if(tab==='persona')       _renderPersonaForm(wrap);
  else if(tab==='salud')         _renderSaludForm(wrap);
  else if(tab==='apartado')      _renderApartadoForm(wrap);
  else if(tab==='patrimonio')    _renderPatrimonioForm(wrap);
  else if(tab==='bancos')        _renderBancosForm(wrap);
  else if(tab==='nutricion')     _renderNutricionForm(wrap);
  else if(tab==='entrenamiento') _renderEntrenamientoForm(wrap);
  else if(tab==='libro')         _renderLibroForm(wrap);
  else if(tab==='movie')         _renderMovieForm(wrap);
  else if(tab==='norut')         _renderNoRutForm(wrap);
  else if(tab==='activity')      _renderActivityForm(wrap);
}

// ══════════════════════════════════════════
//  ACTIVITY FORM
// ══════════════════════════════════════════
function _renderActivityForm(wrap){
  var cols=[
    {id:'personal',   label:'👤 Personal',   color:'#FB923C'},
    {id:'electronics',label:'💼 Trabajo',     color:'#22D3EE'},
    {id:'libro',      label:'📚 Libro',       color:'#60A5FA'},
    {id:'movie',      label:'🎬 Movie',       color:'#F59E0B'},
    {id:'norut',      label:'📌 Pendiente',   color:'#A855F7'},
  ];
  var colBtns=cols.map(function(c){ return '<button class="fopt" style="border-color:'+c.color+'44;color:'+c.color+'88" onclick="event.stopPropagation();document.querySelectorAll(\'#act-col-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');_onActColChange(\''+c.id+'\')">'+c.label+'</button>'; }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">⚡ ¿Qué quieres agregar?</div>'+
    '<div class="fo" id="act-col-opts">'+colBtns+'</div>'+
    '<input type="hidden" id="act-col-tipo" value="">'+
    '<div id="act-col-extra" style="display:flex;flex-direction:column;gap:10px"></div>'+
    '<button onclick="_guardarActivityForm()" class="fguardar" style="display:none" id="act-btn-guardar"><i class="fas fa-bolt" style="color:#FB923C"></i> Agregar</button>'+
    '<div id="act-res" class="fres"></div>'+
    '</div>';
}

function _onActColChange(tipo){
  document.getElementById('act-col-tipo').value=tipo;
  var extra=document.getElementById('act-col-extra');
  var btn=document.getElementById('act-btn-guardar');
  if(btn)btn.style.display='flex';
  var SIMS_OPTS=['energia','hambre','cuerpo','higiene','mental','disfrute','entorno'];
  var RECS=['Diario','Semanal','Eventual'];
  var recHtml='<div><div class="flbl">Recurrencia</div><div class="fo" id="act-rec-opts">'+RECS.map(function(r){return '<button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'act-rec-opts\');document.getElementById(\'act-rec\').value=\''+r+'\'">'+r+'</button>';}).join('')+'</div><input type="hidden" id="act-rec" value="Diario"></div>';
  if(tipo==='personal'){
    extra.innerHTML='<input type="text" id="act-nombre" class="fi" placeholder="Nombre del hábito…" style="font-size:14px">'+recHtml+'<div><div class="flbl">Categoría Sims</div><div class="fo" id="act-sims-opts">'+SIMS_OPTS.map(function(s){return '<button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'act-sims-opts\');document.getElementById(\'act-sims\').value=\''+s+'\'">'+s+'</button>';}).join('')+'</div><input type="hidden" id="act-sims" value=""></div>';
  } else if(tipo==='electronics'){
    extra.innerHTML='<input type="text" id="act-nombre" class="fi" placeholder="Nombre del check de trabajo…" style="font-size:14px">'+recHtml;
  } else {
    var label=tipo==='libro'?'Título del libro':tipo==='movie'?'Título de la película/serie':'Descripción del pendiente';
    extra.innerHTML='<input type="text" id="act-nombre" class="fi" placeholder="'+label+'" style="font-size:14px">';
  }
}
function _guardarActivityForm(){
  var tipo=document.getElementById('act-col-tipo').value;
  var nombre=(document.getElementById('act-nombre')||{}).value;
  var res=document.getElementById('act-res');
  if(!tipo){res.textContent='Selecciona una columna';res.style.color='var(--err)';return;}
  if(!nombre||!nombre.trim()){res.textContent='Escribe un nombre';res.style.color='var(--err)';return;}
  nombre=nombre.trim(); res.textContent='Guardando…'; res.style.color='var(--m)';
  var datos={nombre:nombre};
  if(tipo==='personal'){datos.recurrencia=(document.getElementById('act-rec')||{}).value||'Diario';datos.sims=(document.getElementById('act-sims')||{}).value||'';}
  if(tipo==='electronics'){datos.recurrencia=(document.getElementById('act-rec')||{}).value||'Diario';datos.bw=datos.recurrencia.toLowerCase();}
  var tipoBack=tipo==='electronics'?'electronics':tipo==='libro'?'libro':tipo==='movie'?'movie':tipo==='norut'?'norut':'personal';
  api.agregarAActivity(tipoBack,datos).then(function(r){
    res.textContent=r.ok?'✓ Agregado':'✗ '+(r.mensaje||'Error');
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){showToast('✓ Agregado a Activity Check');setTimeout(cerrarEntrada,800);}
  }).catch(function(){res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  LIBRO / MOVIE / NORUT
// ══════════════════════════════════════════
function _renderLibroForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">📚 Agregar libro</div>'+
    '<input type="text" id="libro-nombre" class="fi" placeholder="Título del libro" style="font-size:15px">'+
    '<input type="text" id="libro-autor" class="fi" placeholder="Autor (opcional)" style="font-size:13px">'+
    '<button onclick="_guardarLibroForm()" class="fguardar"><i class="fas fa-book-open" style="color:#60A5FA"></i> Guardar libro</button>'+
    '<div id="libro-res" class="fres"></div>'+
    '</div>';
}
function _guardarLibroForm(){
  var nombre=(document.getElementById('libro-nombre')||{}).value;
  if(!nombre||!nombre.trim()){showToast('Escribe el título del libro',false);return;}
  nombre=nombre.trim();
  var res=document.getElementById('libro-res');
  if(res){res.textContent='Guardando…';res.style.color='var(--m)';}
  api.agregarAActivity('libro',{nombre:nombre}).then(function(r){
    if(res){res.textContent=r.ok?'✓ Libro guardado':'Error: '+(r.mensaje||'desconocido');res.style.color=r.ok?'var(--ok)':'var(--err)';}
    if(r.ok){showToast('✓ Libro guardado');document.getElementById('libro-nombre').value='';setTimeout(cerrarEntrada,800);}
  }).catch(function(){if(res){res.textContent='Error al guardar';res.style.color='var(--err)';}});
}

function _renderMovieForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">🎬 Registrar película / serie</div>'+
    '<input type="text" id="movie-nombre" class="fi" placeholder="Título de la película o serie" style="font-size:15px">'+
    '<button onclick="_guardarMovieForm()" class="fguardar"><i class="fas fa-film" style="color:#F59E0B"></i> Guardar película</button>'+
    '<div id="movie-res" class="fres"></div>'+
    '</div>';
}
function _guardarMovieForm(){
  var nombre=(document.getElementById('movie-nombre')||{}).value;
  if(!nombre||!nombre.trim()){showToast('Escribe el título',false);return;}
  nombre=nombre.trim();
  var res=document.getElementById('movie-res');
  if(res){res.textContent='Guardando…';res.style.color='var(--m)';}
  api.agregarAActivity('movie',{nombre:nombre}).then(function(r){
    if(res){res.textContent=r.ok?'✓ Guardado':'Error: '+(r.mensaje||'desconocido');res.style.color=r.ok?'var(--ok)':'var(--err)';}
    if(r.ok){showToast('✓ Movie guardado');document.getElementById('movie-nombre').value='';setTimeout(cerrarEntrada,800);}
  }).catch(function(){if(res){res.textContent='Error al guardar';res.style.color='var(--err)';}});
}

function _renderNoRutForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">📌 Agregar pendiente</div>'+
    '<input type="text" id="norut-nombre" class="fi" placeholder="¿Qué hay que hacer?" style="font-size:15px">'+
    '<button onclick="_guardarNoRutForm()" class="fguardar"><i class="fas fa-thumbtack" style="color:#FBBF24"></i> Agregar pendiente</button>'+
    '<div id="norut-res" class="fres"></div>'+
    '</div>';
}
function _guardarNoRutForm(){
  var nombre=(document.getElementById('norut-nombre')||{}).value;
  if(!nombre||!nombre.trim()){showToast('Escribe el nombre del pendiente',false);return;}
  nombre=nombre.trim();
  var res=document.getElementById('norut-res');
  if(res){res.textContent='Guardando…';res.style.color='var(--m)';}
  api.agregarAActivity('norut',{nombre:nombre}).then(function(r){
    if(res){res.textContent=r.ok?'✓ Pendiente guardado':'Error: '+(r.mensaje||'desconocido');res.style.color=r.ok?'var(--ok)':'var(--err)';}
    if(r.ok){showToast('✓ Pendiente guardado');document.getElementById('norut-nombre').value='';setTimeout(cerrarEntrada,800);}
  }).catch(function(){if(res){res.textContent='Error al guardar';res.style.color='var(--err)';}});
}

// ══════════════════════════════════════════
//  BANCOS
// ══════════════════════════════════════════
function _renderBancosForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">🏛️ Registrar pago / banco</div>'+
    '<input type="text" id="ban-concepto" class="fi" placeholder="Concepto del pago" style="font-size:15px">'+
    '<div class="fg2">'+
      '<div><div class="flbl">Monto ($)</div><input type="number" id="ban-monto" class="fi" placeholder="0.00" step="0.01" style="font-size:20px;font-weight:700;text-align:center;color:#22D3EE"></div>'+
      '<div><div class="flbl">Fecha</div><input type="date" id="ban-fecha" class="fi" style="font-size:13px;color-scheme:dark"></div>'+
    '</div>'+
    '<button onclick="_guardarBanco()" class="fguardar"><i class="fas fa-building-columns" style="color:#22D3EE"></i> Registrar pago</button>'+
    '<div id="ban-res" class="fres"></div>'+
    '</div>';
  setTimeout(function(){
    var f=document.getElementById('ban-fecha');
    if(f&&!f.value){var h=new Date();f.value=h.getFullYear()+'-'+String(h.getMonth()+1).padStart(2,'0')+'-'+String(h.getDate()).padStart(2,'0');}
  },50);
}
function _guardarBanco(){
  var concepto=(document.getElementById('ban-concepto')||{}).value||'';
  var monto=parseFloat((document.getElementById('ban-monto')||{}).value);
  var fecha=(document.getElementById('ban-fecha')||{}).value||'';
  var res=document.getElementById('ban-res');
  if(!concepto.trim()||isNaN(monto)||!fecha){if(res){res.textContent='Completa todos los campos';res.style.color='var(--err)';}return;}
  if(res){res.textContent='Guardando…';res.style.color='var(--m)';}
  api.guardarEnBancos(concepto.trim(),monto,fecha).then(function(r){
    if(res){res.textContent=r.ok?'✓ Guardado':'Error: '+(r.mensaje||'desconocido');res.style.color=r.ok?'var(--ok)':'var(--err)';}
    if(r.ok){showToast('✓ Banco guardado');api.getFijos().then(function(fi){window._fijosData=fi;if(typeof renderEntes==='function')renderEntes(fi);});setTimeout(cerrarEntrada,800);}
  }).catch(function(){if(res){res.textContent='Error';res.style.color='var(--err)';}});
}

// ══════════════════════════════════════════
//  NUTRICIÓN (UNA SOLA VEZ)
// ══════════════════════════════════════════
function _renderNutricionForm(wrap){
  var momentos=['Ayuno','Desayuno','Almuerzo','Comida','Merienda','Cena','Snack'];
  var momBtns=momentos.map(function(m){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#nut-mom-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'nut-momento\').value=\''+m+'\'">'+m+'</button>'; }).join('');
  var fastBtns=[0,12,14,16,18,20].map(function(h){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#nut-fast-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'nut-fast\').value='+h+'">'+(h?h+'h':'Sin ayuno')+'</button>'; }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">🥗 ¿Qué comiste?</div>'+
    '<input type="text" id="nut-comida" class="fi" placeholder="Ej. Huevos con aguacate y café" style="font-size:15px">'+
    '<div><div class="flbl">Momento del día</div><div class="fo" id="nut-mom-opts">'+momBtns+'</div><input type="hidden" id="nut-momento" value=""></div>'+
    '<div class="fg2">'+
      '<div><div class="flbl">Calorías (kcal)</div><input type="number" id="nut-cal" class="fi" placeholder="0" style="font-size:18px;font-weight:700;text-align:center"></div>'+
      '<div><div class="flbl">Proteína (g)</div><input type="number" id="nut-prot" class="fi" placeholder="0" style="font-size:18px;font-weight:700;text-align:center"></div>'+
    '</div>'+
    '<div class="fg3">'+
      '<div><div class="flbl">Carbos (g)</div><input type="number" id="nut-carbos" class="fi" placeholder="0" style="text-align:center"></div>'+
      '<div><div class="flbl">Grasa (g)</div><input type="number" id="nut-grasa" class="fi" placeholder="0" style="text-align:center"></div>'+
      '<div><div class="flbl">Agua (L)</div><input type="number" id="nut-agua" class="fi" placeholder="0.0" step="0.1" style="text-align:center"></div>'+
    '</div>'+
    '<div><div class="flbl">Fasting (horas)</div><div class="fo" id="nut-fast-opts">'+fastBtns+'</div><input type="hidden" id="nut-fast" value="0"></div>'+
    '<input type="text" id="nut-notas" class="fi" placeholder="Notas…" style="font-size:13px">'+
    '<button onclick="_guardarNutricion()" class="fguardar"><i class="fas fa-leaf" style="color:#4ADE80"></i> Guardar nutrición</button>'+
    '<div id="nut-res" class="fres"></div>'+
    '</div>';
}
function _guardarNutricion(){
  var comida=document.getElementById('nut-comida').value.trim();
  var res=document.getElementById('nut-res');
  if(!comida){res.textContent='Escribe qué comiste';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  var datos={comida:comida,momento:(document.getElementById('nut-momento')||{}).value||'',calorias:parseFloat((document.getElementById('nut-cal')||{}).value)||0,proteina:parseFloat((document.getElementById('nut-prot')||{}).value)||0,carbos:parseFloat((document.getElementById('nut-carbos')||{}).value)||0,grasa:parseFloat((document.getElementById('nut-grasa')||{}).value)||0,agua:parseFloat((document.getElementById('nut-agua')||{}).value)||0,fasting:parseFloat((document.getElementById('nut-fast')||{}).value)||0,notas:(document.getElementById('nut-notas')||{}).value||'',fecha:fmtD(new Date())};
  api.guardarNutricion(datos).then(function(r){
    res.textContent=r.ok?'✓ Guardado':'✗ '+(r.mensaje||'Error');
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Nutrición guardada');
      document.getElementById('nut-comida').value='';
      api.getNutricion().then(function(d){
        window._nutData=d;
        if(typeof window.renderNutricion==='function') window.renderNutricion(d);
        if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();
      }).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(function(){res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  ENTRENAMIENTO (UNA SOLA VEZ)
// ══════════════════════════════════════════
function _renderEntrenamientoForm(wrap){
  var tipos=['Fuerza','Cardio','HIIT','Flexibilidad','Deporte','Caminata'];
  var tipoBtns=tipos.map(function(t){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#ent-tipo-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'ent-tipo\').value=\''+t+'\'">'+t+'</button>'; }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">💪 Registrar sesión</div>'+
    '<div><div class="flbl">Tipo de entrenamiento</div><div class="fo" id="ent-tipo-opts">'+tipoBtns+'</div><input type="hidden" id="ent-tipo" value=""></div>'+
    '<input type="text" id="ent-ejercicio" class="fi" placeholder="Ejercicio (ej. Press banca, Caminata 5km)" style="font-size:14px">'+
    '<div class="fg2">'+
      '<div><div class="flbl">Duración (min)</div><input type="number" id="ent-dur" class="fi" placeholder="0" style="font-size:20px;font-weight:700;text-align:center"></div>'+
      '<div><div class="flbl">Distancia (km)</div><input type="number" id="ent-dist" class="fi" placeholder="0.0" step="0.1" style="font-size:20px;font-weight:700;text-align:center"></div>'+
    '</div>'+
    '<div class="fg3">'+
      '<div><div class="flbl">Series</div><input type="number" id="ent-series" class="fi" placeholder="0" style="text-align:center"></div>'+
      '<div><div class="flbl">Reps</div><input type="number" id="ent-reps" class="fi" placeholder="0" style="text-align:center"></div>'+
      '<div><div class="flbl">Peso (kg)</div><input type="number" id="ent-peso" class="fi" placeholder="0" step="0.5" style="text-align:center"></div>'+
    '</div>'+
    '<input type="text" id="ent-notas" class="fi" placeholder="Notas de la sesión…" style="font-size:13px">'+
    '<button onclick="_guardarEntrenamiento()" class="fguardar"><i class="fas fa-dumbbell" style="color:#FB923C"></i> Guardar sesión</button>'+
    '<div id="ent-res" class="fres"></div>'+
    '</div>';
}
function _guardarEntrenamiento(){
  var ejercicio=document.getElementById('ent-ejercicio').value.trim();
  var res=document.getElementById('ent-res');
  if(!ejercicio){res.textContent='Escribe el ejercicio';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  var datos={tipo:(document.getElementById('ent-tipo')||{}).value||'',ejercicio:ejercicio,duracion:parseFloat((document.getElementById('ent-dur')||{}).value)||0,distancia:parseFloat((document.getElementById('ent-dist')||{}).value)||0,series:parseFloat((document.getElementById('ent-series')||{}).value)||0,reps:parseFloat((document.getElementById('ent-reps')||{}).value)||0,peso:parseFloat((document.getElementById('ent-peso')||{}).value)||0,notas:(document.getElementById('ent-notas')||{}).value||'',fecha:fmtD(new Date())};
  api.guardarEntrenamiento(datos).then(function(r){
    res.textContent=r.ok?'✓ Guardado':'✗ '+(r.mensaje||'Error');
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Entrenamiento guardado');
      document.getElementById('ent-ejercicio').value='';
      api.getEntrenamiento().then(function(d){window._entData=d;if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();}).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(function(){res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  PENSAMIENTO (UNA SOLA VEZ)
// ══════════════════════════════════════════
function _renderPensamientoForm(wrap){
  var cats=['Emoción','Idea','Reflexión','Decisión','Sueño'];
  var catColors={'Emoción':'#EC4899','Idea':'#3B82F6','Reflexión':'#8B5CF6','Decisión':'#F59E0B','Sueño':'#06B6D4'};
  var catBtns=cats.map(function(c){
    return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#p-cat-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'p-cat\').value=\''+c+'\'" style="border-color:'+catColors[c]+'33;color:'+catColors[c]+'88">'+c+'</button>';
  }).join('');
  var enBtns=[1,2,3,4,5].map(function(n){
    var col=n<=2?'#EF4444':n<=3?'#F59E0B':'#4ADE80';
    return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#p-en-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'p-energia\').value='+n+'" style="border-color:'+col+'44;color:'+col+'88;min-width:36px;text-align:center">'+n+'</button>';
  }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">💭 ¿En qué estás pensando?</div>'+
    '<textarea id="p-texto" class="fi" rows="4" placeholder="Escribe aquí tu pensamiento…" style="resize:none;line-height:1.6"></textarea>'+
    '<div class="fg2">'+
      '<div><div class="flbl">Categoría</div><div class="fo" id="p-cat-opts">'+catBtns+'</div><input type="hidden" id="p-cat" value=""></div>'+
      '<div><div class="flbl">Energía ⚡</div><div class="fo" id="p-en-opts">'+enBtns+'</div><input type="hidden" id="p-energia" value=""></div>'+
    '</div>'+
    '<div><div class="flbl">Etiquetas</div><input type="text" id="p-etiquetas" class="fi" placeholder="trabajo, familia, proyecto…" style="font-size:13px;padding:9px 14px"></div>'+
    '<button onclick="_guardarPensamiento()" class="fguardar"><i class="fas fa-brain" style="color:#C4B5FD"></i> Guardar pensamiento</button>'+
    '<div id="p-res" class="fres"></div>'+
    '</div>';
}
function _guardarPensamiento(){
  const texto=document.getElementById('p-texto').value.trim();
  const categoria=document.getElementById('p-cat').value;
  const energia=document.getElementById('p-energia').value;
  const etiquetas=document.getElementById('p-etiquetas').value.trim();
  const res=document.getElementById('p-res');
  if(!texto){res.textContent='Escribe algo primero';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  api.guardarPensamiento({texto,categoria,energia:energia||null,etiquetas,fecha:fmtD(new Date())}).then(r=>{
    res.textContent=r.ok?'✓ Guardado':'✗ '+r.mensaje;
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Pensamiento guardado');
      document.getElementById('p-texto').value='';
      document.getElementById('p-etiquetas').value='';
      document.querySelectorAll('#p-cat-opts .fopt,#p-en-opts .fopt').forEach(b=>b.classList.remove('on'));
      document.getElementById('p-cat').value='';
      document.getElementById('p-energia').value='';
      api.getPensamientos().then(function(d){window._pensamientosData=d;if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();}).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  PERSONA (UNA SOLA VEZ)
// ══════════════════════════════════════════
function _renderPersonaForm(wrap){
  var tipos=['Familia','Amigo','Pareja','Trabajo','Médico','Otro'];
  var tipoBtns=tipos.map(function(t){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#per-tipo-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'per-tipo\').value=\''+t+'\'">'+t+'</button>'; }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">👥 ¿Con quién interactuaste?</div>'+
    '<input type="text" id="per-nombre" class="fi" placeholder="Nombre de la persona" style="font-size:15px">'+
    '<div><div class="flbl">Tipo de relación</div><div class="fo" id="per-tipo-opts">'+tipoBtns+'</div><input type="hidden" id="per-tipo" value=""></div>'+
    '<div><div class="flbl">Energía de la interacción</div>'+
    '<div class="fo" id="per-energia-opts">'+
      '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#per-energia-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'per-energia\').value=1" style="border-color:#22C55E44;color:#22C55E88">⚡ Positiva</button>'+
      '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#per-energia-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'per-energia\').value=0">— Neutral</button>'+
      '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#per-energia-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'per-energia\').value=-1" style="border-color:#EF444444;color:#EF444488">↓ Negativa</button>'+
    '</div><input type="hidden" id="per-energia" value=""></div>'+
    '<div><div class="flbl">Notas</div><textarea id="per-notas" class="fi" rows="2" placeholder="¿De qué hablaron? ¿Cómo se sintió?" style="resize:none;font-size:13px"></textarea></div>'+
    '<button onclick="_guardarPersona()" class="fguardar"><i class="fas fa-user-check" style="color:#EC4899"></i> Registrar interacción</button>'+
    '<div id="per-res" class="fres"></div>'+
    '</div>';
}
function _guardarPersona(){
  const nombre=document.getElementById('per-nombre').value.trim();
  const tipo=document.getElementById('per-tipo').value;
  const energia=document.getElementById('per-energia').value;
  const notas=document.getElementById('per-notas').value.trim();
  const res=document.getElementById('per-res');
  if(!nombre){res.textContent='Escribe un nombre';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  api.guardarInteraccion({nombre,tipo,energia:energia!==''?Number(energia):0,notas}).then(r=>{
    res.textContent=r.ok?'✓ '+r.mensaje:'✗ '+r.mensaje;
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Interacción guardada');
      document.getElementById('per-nombre').value='';
      document.getElementById('per-notas').value='';
      document.querySelectorAll('#per-tipo-opts .fopt,#per-energia-opts .fopt').forEach(b=>b.classList.remove('on'));
      document.getElementById('per-tipo').value='';
      document.getElementById('per-energia').value='';
      api.getRelaciones().then(function(d){window._relacionesData=d;if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();}).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  SALUD (UNA SOLA VEZ)
// ══════════════════════════════════════════
function _renderSaludForm(wrap){
  var tipos=['Cita','Síntoma','Medicamento','Resultado','Vacuna','Chequeo'];
  var tipoBtns=tipos.map(function(t){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#sal-tipo-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'sal-tipo\').value=\''+t+'\'">'+t+'</button>'; }).join('');
  var estados=['Pendiente','Completado','Cancelado'];
  var estBtns=estados.map(function(e){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#sal-est-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'sal-estado\').value=\''+e+'\'">'+e+'</button>'; }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">🏥 Registro de salud</div>'+
    '<div><div class="flbl">Tipo</div><div class="fo" id="sal-tipo-opts">'+tipoBtns+'</div><input type="hidden" id="sal-tipo" value=""></div>'+
    '<input type="text" id="sal-desc" class="fi" placeholder="Descripción (ej. Cita con Dr. García)" style="font-size:14px">'+
    '<div class="fg2">'+
      '<div><div class="flbl">Doctor / Especialista</div><input type="text" id="sal-doctor" class="fi" placeholder="Opcional" style="font-size:13px"></div>'+
      '<div><div class="flbl">Próxima cita</div><input type="date" id="sal-proxima" class="fi" style="font-size:13px;color-scheme:dark"></div>'+
    '</div>'+
    '<div><div class="flbl">Estado</div><div class="fo" id="sal-est-opts">'+estBtns+'</div><input type="hidden" id="sal-estado" value="Pendiente"></div>'+
    '<input type="text" id="sal-notas" class="fi" placeholder="Notas…" style="font-size:13px">'+
    '<button onclick="_guardarSalud()" class="fguardar"><i class="fas fa-heart-pulse" style="color:#EF4444"></i> Guardar registro</button>'+
    '<div id="sal-res" class="fres"></div>'+
    '</div>';
}
function _guardarSalud(){
  var tipo=(document.getElementById('sal-tipo')||{}).value||'';
  var desc=(document.getElementById('sal-desc')||{}).value||'';
  var doctor=(document.getElementById('sal-doctor')||{}).value||'';
  var proxima=(document.getElementById('sal-proxima')||{}).value||'';
  var estado=(document.getElementById('sal-estado')||{}).value||'Pendiente';
  var notas=(document.getElementById('sal-notas')||{}).value||'';
  var res=document.getElementById('sal-res');
  if(!desc.trim()){res.textContent='Escribe una descripción';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  api.guardarSalud({tipo:tipo,descripcion:desc.trim(),doctor:doctor,proxima:proxima,estado:estado,notas:notas,fecha:fmtD(new Date())}).then(function(r){
    res.textContent=r.ok?'✓ Guardado':'✗ '+(r.mensaje||'Error');
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Salud guardada');
      api.getSalud().then(function(d){window._saludData=d;if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();}).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(function(){res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  APARTADO
// ══════════════════════════════════════════
function _renderApartadoForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">💰 Nuevo apartado</div>'+
    '<input type="text" id="ap-nombre" class="fi" placeholder="Nombre del apartado" style="font-size:14px">'+
    '<input type="text" id="ap-categoria" class="fi" placeholder="Categoría (Renta, Viaje, Emergencia…)" style="font-size:13px">'+
    '<div class="fg2">'+
      '<div><div class="flbl">Monto</div><input type="number" id="ap-monto" class="fi" placeholder="0.00" step="0.01" style="font-size:18px;font-weight:700;text-align:center;color:#FBBF24"></div>'+
      '<div><div class="flbl">Banco</div><input type="text" id="ap-banco" class="fi" placeholder="BBVA, BEATS…" style="font-size:13px"></div>'+
    '</div>'+
    '<div><div class="flbl">Fecha meta</div><input type="date" id="ap-meta" class="fi" style="font-size:13px;color-scheme:dark"></div>'+
    '<textarea id="ap-notas" class="fi" rows="2" placeholder="Notas…" style="resize:none;font-size:13px"></textarea>'+
    '<button onclick="_guardarApartado()" class="fguardar"><i class="fas fa-lock" style="color:#FBBF24"></i> Guardar apartado</button>'+
    '<div id="ap-res" class="fres"></div>'+
    '</div>';
}
function _guardarApartado(){
  const nombre=document.getElementById('ap-nombre').value.trim();
  const categoria=document.getElementById('ap-categoria').value.trim();
  const monto=parseFloat(document.getElementById('ap-monto').value);
  const banco=document.getElementById('ap-banco').value.trim();
  const meta=document.getElementById('ap-meta').value;
  const notas=document.getElementById('ap-notas').value.trim();
  const res=document.getElementById('ap-res');
  if(!nombre||isNaN(monto)){res.textContent='Nombre y monto requeridos';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  api.guardarApartado({nombre,categoria,monto,banco,meta:meta||null,notas,estado:'Activo'}).then(r=>{
    res.textContent=r.ok?'✓ Guardado':'✗ '+r.mensaje;
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Apartado guardado');
      ['ap-nombre','ap-categoria','ap-monto','ap-banco','ap-meta','ap-notas'].forEach(function(id){var e=document.getElementById(id);if(e) e.value='';});
      api.getApartados().then(function(d){window._apartadosData=d.items||[];if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();}).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  PATRIMONIO
// ══════════════════════════════════════════
function _renderPatrimonioForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">🏦 Registrar movimiento</div>'+
    '<div><div class="flbl">Tipo</div><div class="fo" id="pat-tipo-opts">'+
      '<button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'pat-tipo-opts\');document.getElementById(\'pat-tipo\').value=\'ahorro\';_onPatTipoChange()">💳 Banco</button>'+
      '<button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'pat-tipo-opts\');document.getElementById(\'pat-tipo\').value=\'efectivo\';_onPatTipoChange()">💵 Efectivo</button>'+
      '<button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'pat-tipo-opts\');document.getElementById(\'pat-tipo\').value=\'inversion\';_onPatTipoChange()">📈 Inversión</button>'+
    '</div><input type="hidden" id="pat-tipo" value=""></div>'+
    '<input type="text" id="pat-concepto" class="fi" placeholder="Concepto" style="font-size:14px">'+
    '<div class="fg2">'+
      '<div><div class="flbl">Monto</div><input type="number" id="pat-monto" class="fi" placeholder="0.00" step="0.01" style="font-size:18px;font-weight:700;text-align:center"></div>'+
      '<div><div class="flbl">Fecha</div><input type="date" id="pat-fecha" class="fi" style="font-size:13px;color-scheme:dark"></div>'+
    '</div>'+
    '<div id="pat-extra" style="display:flex;flex-direction:column;gap:10px"></div>'+
    '<button onclick="_guardarPatrimonio()" class="fguardar"><i class="fas fa-landmark" style="color:#C4B5FD"></i> Guardar</button>'+
    '<div id="pat-res" class="fres"></div>'+
    '</div>';
  document.getElementById('pat-fecha').value=fmtD(new Date());
}
function _onPatTipoChange(){
  const tipo=document.getElementById('pat-tipo').value;
  const extra=document.getElementById('pat-extra');
  if(!extra)return;
  if(tipo==='ahorro'){
    extra.innerHTML='<input type="text" id="pat-banco" class="fi" placeholder="Banco" style="font-size:13px"><div class="fo" id="pat-mov-opts"><button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'pat-mov-opts\');document.getElementById(\'pat-movtipo\').value=\'Depósito\'">Depósito</button><button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'pat-mov-opts\');document.getElementById(\'pat-movtipo\').value=\'Retiro\'">Retiro</button></div><input type="hidden" id="pat-movtipo" value="Depósito">';
  } else if(tipo==='inversion'){
    extra.innerHTML='<input type="text" id="pat-instrumento" class="fi" placeholder="Instrumento (CETES, GBM…)" style="font-size:13px"><div class="fg2"><input type="text" id="pat-plazo" class="fi" placeholder="Plazo" style="font-size:13px"><input type="number" id="pat-rendimiento" class="fi" placeholder="Rendimiento $" step="0.01" style="font-size:13px"></div>';
  } else { extra.innerHTML=''; }
}
function _guardarPatrimonio(){
  const tipo=document.getElementById('pat-tipo').value;
  const concepto=document.getElementById('pat-concepto').value.trim();
  const monto=parseFloat(document.getElementById('pat-monto').value);
  const fecha=document.getElementById('pat-fecha').value;
  const res=document.getElementById('pat-res');
  if(!tipo){res.textContent='Selecciona un tipo';res.style.color='var(--err)';return;}
  if(!concepto||isNaN(monto)){res.textContent='Concepto y monto requeridos';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  let datos={concepto,monto,fecha}; let promise;
  if(tipo==='ahorro'){
    var bn=document.getElementById('pat-banco'); var mv=document.getElementById('pat-movtipo');
    datos.banco=bn?bn.value.trim():''; datos.tipo=mv?mv.value:'Depósito';
    promise=api.guardarAhorro(datos);
  } else if(tipo==='efectivo'){
    promise=api.guardarEfectivo(datos);
  } else {
    var ins=document.getElementById('pat-instrumento'); var plz=document.getElementById('pat-plazo'); var rd=document.getElementById('pat-rendimiento');
    datos.instrumento=ins?ins.value.trim():'CETES'; datos.plazo=plz?plz.value.trim():''; datos.rendimiento=rd?(parseFloat(rd.value)||0):0;
    promise=api.guardarInversion(datos);
  }
  promise.then(r=>{
    res.textContent=r.ok?'✓ Guardado':'✗ '+r.mensaje;
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Patrimonio guardado');
      api.getPatrimonio().then(function(d){window._patrimonioData=d;if(typeof renderPatrimonio==='function')renderPatrimonio(d);if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();}).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  HELPERS COMPARTIDOS
// ══════════════════════════════════════════
function _selOpt(btn,containerId){
  document.querySelectorAll('#'+containerId+' .fopt,#'+containerId+' .opt').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
}

function buscarFilaId(){
  const id=document.getElementById('editar-id-input').value.trim();
  if(!id){document.getElementById('editar-id-msg').textContent='Escribe un ID';return;}
  const spin=document.getElementById('buscar-spin');
  const msg=document.getElementById('editar-id-msg');
  if(spin)spin.style.display='block';
  msg.textContent='Buscando…';msg.style.color='var(--m)';
  api.getFilaPorId(id).then(r=>{
    if(spin)spin.style.display='none';
    if(!r.ok){msg.textContent='✗ '+r.mensaje;msg.style.color='var(--err)';return;}
    _filaEditar=r.fila;_idEditar=r.id;
    msg.textContent='✓ ID '+r.id+' — fila '+r.fila;msg.style.color='var(--ok)';
    document.getElementById('fecha').value=r.fecha||fmtD(new Date());marcarDone('fecha');
    proxSel=r.proyecto;setFieldVal('proyecto',r.proyecto,!r.proyecto);_selectOpt('sw-proyecto',r.proyecto);marcarDone('proyecto');
    contactoSel=r.contacto;setFieldVal('contacto',r.contacto,!r.contacto);_selectOpt('sw-contacto',r.contacto);marcarDone('contacto');
    setFieldVal('concepto',r.concepto,!r.concepto);marcarDone('concepto');
    const m=r.monto||0;sign=m>=0?1:-1;
    document.getElementById('monto').value=Math.abs(m);
    document.getElementById('sbp').className='msign'+(sign===1?' pos':'');
    document.getElementById('sbn').className='msign'+(sign===-1?' neg':'');
    upM();marcarDone('monto');
    recSel=r.recurrencia;setFieldVal('recurrencia',r.recurrencia,!r.recurrencia);_selectOpt('sw-recurrencia',r.recurrencia);marcarDone('recurrencia');
    document.getElementById('clave').value=r.clave||'';setFieldVal('clave',r.clave||'',!r.clave);if(r.clave)marcarDone('clave');
    necesidadSel=r.necesidad||'';if(r.necesidad){setFieldVal('necesidad',r.necesidad.slice(0,30),false);marcarDone('necesidad');}
  }).catch(e=>{if(spin)spin.style.display='none';msg.textContent='Error: '+e.message;msg.style.color='var(--err)';});
}
function _selectOpt(swId,val){
  const w=document.getElementById(swId); if(!w)return;
  w.querySelectorAll('.opt').forEach(b=>{b.classList.toggle('on',b.textContent.trim()===val);});
}

// ══════════════════════════════════════════
//  ENTES
// ══════════════════════════════════════════
function renderEntes(data){
  window._fijosData=data||[];
  const body=document.getElementById('entes-list');
  if(!body) return;
  if(!data||!data.length){body.innerHTML='<div style="padding:16px;color:var(--m);text-align:center">Sin datos</div>';return;}
  const apartadosPorBanco={};let totalApartadosActivos=0;
  (window._apartadosData||[]).forEach(ap=>{if(ap.estado&&ap.estado.toLowerCase()==='usado')return;const banco=(ap.banco||'').trim().toUpperCase();apartadosPorBanco[banco]=(apartadosPorBanco[banco]||0)+(ap.monto||0);totalApartadosActivos+=(ap.monto||0);});
  const total=data.reduce((s,f)=>f.nombre==='P'?s:s+(f.monto||0),0);
  const totalDisponible=total-totalApartadosActivos;
  const {txt:tt,cls:tc}=fmtMoneda(totalDisponible);
  const totalEl=document.getElementById('entes-total');
  if(totalEl){totalEl.textContent=tt;totalEl.className='sec-hdr-val '+tc;}
  const hayExcluidos=data.some(f=>f.nombre==='P');
  body.innerHTML=data.map(f=>{
    const {txt,cls}=fmtMoneda(f.monto);const excluido=f.nombre==='P';
    const bancKey=(f.nombre||'').trim().toUpperCase();const apBanco=apartadosPorBanco[bancKey]||0;
    const disponible=(f.monto||0)-apBanco;const {txt:dTxt}=fmtMoneda(disponible);
    return `<div class="ente-row${excluido?' excluido-total':''}" onclick="togEnteEdit(${f.fila},event)">
      <div class="ente-nombre">${f.nombre}</div>
      <div class="ente-right">
        <div style="text-align:right">
          <div class="ente-monto ${cls}" id="em-${f.fila}">${txt}</div>
          ${!excluido&&apBanco>0?`<div style="font-size:11px;color:var(--m);margin-top:2px">disponible: <span style="color:#4ADE80;font-weight:700;font-size:12px">${dTxt}</span></div>`:''}
        </div>
        <div class="ente-fecha">${fmtDiaSemana(f.fecha)}</div>
      </div>
    </div>
    <div class="ente-edit" id="ee-${f.fila}">
      <input type="number" value="${f.monto!==null?f.monto:''}" step="0.01" inputmode="decimal" id="ei-${f.fila}" placeholder="0.00"
        onkeydown="if(event.key==='Enter')guardarEnte(${f.fila},event);if(event.key==='Escape')togEnteEdit(${f.fila},event)">
      <button class="btn-check" id="ec-${f.fila}" onclick="guardarEnte(${f.fila},event)"><i class="fas fa-check" id="ei-ico-${f.fila}"></i></button>
    </div>`;
  }).join('')+(hayExcluidos?'<div class="ente-excluido-nota">* excluido del total</div>':'');
}
function togEnteEdit(fila, evt){
  // v5.132: hay IDs ee-FILA duplicados en el DOM porque renderEntes y
  // renderPatrimonio generan ambos sus propias filas editables con los
  // mismos IDs. getElementById('ee-3') retorna el PRIMERO del DOM, que
  // puede no ser el visible. Solución: usar el event para encontrar el
  // .ente-row clickeado y de ahí navegar al .ente-edit que le sigue.
  evt = evt || window.event;
  var ee = null;
  if(evt && evt.currentTarget && evt.currentTarget.classList && evt.currentTarget.classList.contains('ente-row')){
    // El elemento clickeado es el .ente-row. El .ente-edit es su hermano siguiente.
    ee = evt.currentTarget.nextElementSibling;
    if(!ee || !ee.classList.contains('ente-edit')) ee = null;
  }
  if(!ee && evt && evt.target){
    // Si currentTarget no funcionó, subir desde target hasta encontrar .ente-row
    var row = evt.target.closest && evt.target.closest('.ente-row');
    if(row){
      var sib = row.nextElementSibling;
      if(sib && sib.classList.contains('ente-edit')) ee = sib;
    }
  }
  // Fallback: getElementById (comportamiento original) — pero ahora solo si
  // no hay event (p.ej. llamada desde teclado de un input específico).
  if(!ee) ee = document.getElementById('ee-'+fila);
  if(!ee) return;
  var isOpen = ee.classList.contains('open');
  // Cerrar TODOS los otros editores antes de abrir
  document.querySelectorAll('.ente-edit.open').forEach(function(e){ e.classList.remove('open'); });
  if(!isOpen){
    ee.classList.add('open');
    // Buscar el input dentro de ESTE ente-edit (no por ID global)
    var inp = ee.querySelector('input[type="number"]');
    if(inp) inp.focus();
  }
}
window.togEnteEdit = togEnteEdit;

function guardarEnte(fila, evt){
  // v5.132: mismo problema — buscar el input dentro del contenedor visible.
  evt = evt || window.event;
  var inp = null;
  if(evt && evt.target){
    var ee = evt.target.closest && evt.target.closest('.ente-edit');
    if(ee) inp = ee.querySelector('input[type="number"]');
  }
  if(!inp) inp = document.getElementById('ei-'+fila);
  if(!inp) return;
  var val = parseFloat(inp.value);
  if(isNaN(val)) return;
  // Buscar el ícono dentro del mismo ente-edit visible
  var ico = null;
  if(evt && evt.target){
    var ee2 = evt.target.closest && evt.target.closest('.ente-edit');
    if(ee2) ico = ee2.querySelector('.btn-check i');
  }
  if(!ico) ico = document.getElementById('ei-ico-'+fila);
  if(ico) ico.className = 'fas fa-circle-notch fa-spin';
  api.actualizarFijo(fila,val).then(function(r){
    if(ico) ico.className = 'fas fa-check';
    if(r.ok){
      // Actualizar TODOS los em-FILA visibles (puede haber duplicados)
      document.querySelectorAll('[id="em-'+fila+'"]').forEach(function(em){
        var fm = fmtMoneda(val);
        em.textContent = fm.txt;
        em.className = 'ente-monto ' + fm.cls;
      });
      // Cerrar TODOS los ente-edit abiertos
      document.querySelectorAll('.ente-edit.open').forEach(function(e){ e.classList.remove('open'); });
      Promise.all([api.getFijos(),api.getApartados(),api.getPatrimonio()]).then(function(arr){
        var fijos=arr[0], apData=arr[1], pat=arr[2];
        if(apData && typeof renderApartados==='function') renderApartados(apData);
        if(typeof renderEntes==='function') renderEntes(fijos);
        if(pat && typeof renderPatrimonio==='function'){ window._patrimonioData=pat; renderPatrimonio(pat); }
        if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();
      }).catch(function(){
        api.getFijos().then(function(f){ if(typeof renderEntes==='function') renderEntes(f); });
      });
    }
  }).catch(function(){ if(ico) ico.className = 'fas fa-check'; });
}
window.guardarEnte = guardarEnte;

// ══════════════════════════════════════════
//  SOS
// ══════════════════════════════════════════

/* ── APERTURA/CIERRE + PRESETS (verbatim raw-overlay.js:8711-8820) ── */
function abrirFormulario(modo){
  var dd=document.getElementById('entrada-dropdown');
  if(dd){
    dd.style.cssText=[
      'position:fixed','inset:0','z-index:9001',
      'display:flex','align-items:center','justify-content:center',
      'background:radial-gradient(ellipse at center,rgba(80,40,140,0.18) 0%,rgba(4,4,14,0.72) 60%,rgba(0,0,8,0.82) 100%)',
      'backdrop-filter:blur(28px) saturate(160%) brightness(0.7)',
      '-webkit-backdrop-filter:blur(28px) saturate(160%) brightness(0.7)',
      'background-image:radial-gradient(ellipse at center,rgba(80,40,140,0.18) 0%,rgba(4,4,14,0.72) 100%),linear-gradient(rgba(120,80,200,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,200,0.03) 1px,transparent 1px)',
      'background-size:auto,48px 48px,48px 48px',
    ].join(';');
    dd.classList.add('show');
    if(!dd._dialClickOut){
      dd._dialClickOut=true;
      dd.addEventListener('click',function(e){
        if(e.target===dd) cerrarEntrada();
      });
    }
  }
  var inner=document.getElementById('sec-entrada');
  if(inner){
    inner.style.cssText='width:440px;max-width:96vw;max-height:90vh;overflow-y:auto;display:flex;flex-direction:column';
  }
  if(typeof _inyectarToggleModo==='function') _inyectarToggleModo();
  var tabs=document.getElementById('toggle-modo-wrap');
  if(tabs) tabs.style.display='none';
  var p1=document.getElementById('entrada-paso1');
  var p2=document.getElementById('entrada-paso2');
  if(p1) p1.style.display='none';
  if(p2) p2.style.display='block';
  if(typeof setModoEntrada==='function') setModoEntrada(modo);
  if(window._dialPreset && Object.keys(window._dialPreset).length){
    var presetSnap = JSON.parse(JSON.stringify(window._dialPreset));
    setTimeout(function(){ _aplicarDialPreset(presetSnap); }, 120);
    window._dialPreset={};
  }
}

function _aplicarDialPreset(p){
  function selectOpt(swId, val){
    var w=document.getElementById(swId); if(!w) return;
    w.querySelectorAll('.opt').forEach(function(b){
      if(b.textContent.trim()===val){ if(!b.classList.contains('on')) b.click(); }
    });
  }
  function setVal(id, val){
    var el=document.getElementById('cv-'+id)||document.getElementById(id);
    if(!el) return;
    el.textContent=val; el.value=val;
    el.classList.remove('empty');
  }

  if(p.momento){ selectOpt('sw-momento', p.momento); setVal('momento', p.momento); }
  if(p.tipo && p.tab==='entrenamiento'){ selectOpt('sw-tipo-entrena', p.tipo); setVal('tipo', p.tipo); }
  if(p.tipo && p.tab==='salud'){ selectOpt('sw-tipo-salud', p.tipo); setVal('tipo-salud', p.tipo); }
  if(p.tipo && p.tab==='patrimonio'){ selectOpt('sw-tipo-patrimonio', p.tipo); setVal('tipo-patrimonio', p.tipo); }
  if(p.categoria){ selectOpt('sw-cat-pensamiento', p.categoria); setVal('categoria', p.categoria); }
  if(p.energia !== undefined){
    var eMap = {1:'Positiva', 0:'Neutral', '-1':'Negativa'};
    var eLabel = eMap[String(p.energia)] || eMap[p.energia];
    if(eLabel){ selectOpt('sw-energia-persona', eLabel); setVal('energia', eLabel); }
  }
  if(p.banco){
    selectOpt('sw-banco', p.banco);
    setVal('banco', p.banco);
    var entes=document.querySelectorAll('.ente-nombre');
    entes.forEach(function(el){
      if(el.textContent.trim()===p.banco){
        var row=el.closest('.ente-row'); if(row) row.click();
      }
    });
  }
  if(p.tab==='editar' && p.filaId){
    setTimeout(function(){
      var inp=document.getElementById('editar-id-input');
      if(inp){ inp.value=p.filaId; if(typeof buscarFilaId==='function') buscarFilaId(); }
    }, 80);
  }
  if(p.tab && ['libro','movie','norut'].includes(p.tab)){
    var btn=document.getElementById('btn-tab-'+p.tab);
    if(btn && !btn.classList.contains('on')) btn.click();
  }
}

function cerrarEntrada(){
  // v7.085 — cerrar el popup CONCEPTO si quedo abierto: cerrar el form
  // con el popup vivo lo dejaba huerfano cruzandose con el dial.
  var _pc = document.getElementById('popup-concepto');
  if(_pc) _pc.classList.remove('show');
  // v6.031: cerrar el formulario RAW ya NO cierra el overlay. El
  // formulario vive sobre el dial (que es el Home); al cerrarlo debes
  // quedar en el dial, no salir al anverso vacío. Antes llamaba
  // cerrarDial() y eso te expulsaba del Home — el "bug del anverso".
  var dd=document.getElementById('entrada-dropdown');
  if(dd){ dd.classList.remove('show'); dd.style.display='none'; }
  // v6.050: btn-nueva-entrada retirado en v6.010 — sin botón que limpiar.
  var p1=document.getElementById('entrada-paso1');
  var p2=document.getElementById('entrada-paso2');
  if(p1) p1.style.display='block';
  if(p2) p2.style.display='none';
  // Asegurar que el overlay (Home) siga visible y activo.
  if(typeof abrirDial === 'function' && !window._dialVisible){
    abrirDial();
  }
}

function volverAPaso1(){ cerrarEntrada(); abrirDial(); }
function abrirEntrada(){ abrirDial(); }
function _abrirEntradaLegacy(){ abrirDial(); }

/* ── SHIMS v11 (mínimos; typeof-guardados donde v9 refresca renders
   que aún no viven aquí) ── */
if(typeof window.renderAnualidad!=='function') window.renderAnualidad=function(){};
if(typeof window.onDatosMes!=='function')      window.onDatosMes=function(){};
window.oPanel = function(){ if(window._v11Hint) window._v11Hint('GESTIONAR LISTA LLEGA CON LOS BOARDS'); };
window._setSheetUrl = function(u){ if(u) sheetUrl=u; };
window._formListo = true;
console.log('[v11-form] E3-D3 · form RAW activo (api extendida: insertarEnRAW/editarFilaRAW y guardar*)');
