/* LifeOS — raw-juice.js (E4 · COMPARTIDO v9 + v11)
   ═══════════════════════════════════════════════════════════════════
   CAPA JUICE (spec: AUTOPSIAS-3-SITIOS.md — obys/joseph/hubtown):
   · GRANO fílmico: feTurbulence SVG en overlay fijo, jitter por steps
     (8 fps de salto de fase, como cine), opacidad 0.035 — textura,
     no ruido.
   · VIÑETA respirante: bordes que oscurecen sutil y laten a 9s.
   · ABERRACIÓN CROMÁTICA de borde: dos velos radiales rojo/cian
     desplazados 1px, solo en la periferia — el look "lente".
   Todo en overlays (pointer-events:none, z:250 — bajo modales 9k):
   CERO riesgo al canvas WebGL (ley: nada de filtros/transiciones
   sobre #gl).
   · FRESNEL del planeta (SOLO v11, si existe la esfera del motor):
     malla rim BackSide aditiva con shader fresnel clásico — el borde
     del planeta gana luz violeta contra el cosmos.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── overlays ── */
var wrap = document.createElement('div');
wrap.id = 'juice';
wrap.style.cssText = 'position:fixed;inset:0;z-index:250;pointer-events:none';
var GRANO_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">' +
  '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>' +
  '<feColorMatrix type="saturate" values="0"/></filter>' +
  '<rect width="220" height="220" filter="url(%23g)" opacity="0.5"/></svg>');
wrap.innerHTML =
  '<div id="juice-grano" style="position:absolute;inset:-40px;' +
    'background-image:url(&quot;' + GRANO_SVG + '&quot;);background-size:220px 220px;' +
    'opacity:.035;mix-blend-mode:overlay"></div>' +
  '<div id="juice-vig" style="position:absolute;inset:0;' +
    'background:radial-gradient(ellipse at 50% 46%,transparent 58%,rgba(2,4,12,.34) 100%);' +
    'animation:juiceVig 9s ease-in-out infinite"></div>' +
  '<div style="position:absolute;inset:0;transform:translateX(1px);' +
    'background:radial-gradient(ellipse at 50% 50%,transparent 78%,rgba(255,0,60,.045) 100%);' +
    'mix-blend-mode:screen"></div>' +
  '<div style="position:absolute;inset:0;transform:translateX(-1px);' +
    'background:radial-gradient(ellipse at 50% 50%,transparent 78%,rgba(0,220,255,.045) 100%);' +
    'mix-blend-mode:screen"></div>';
var st = document.createElement('style');
st.textContent =
  '@keyframes juiceVig{0%,100%{opacity:.92}50%{opacity:1}}';
document.head.appendChild(st);
document.body.appendChild(wrap);

/* grano vivo: salto de fase a ~8fps (steps de cine, no deslizamiento) */
(function(){
  var g = document.getElementById('juice-grano'), t = 0;
  setInterval(function(){
    t++;
    g.style.backgroundPosition =
      ((t*37)%220) + 'px ' + ((t*61)%220) + 'px';
  }, 125);
})();

/* ── FRESNEL del planeta (solo si el motor v11 está presente) ── */
function _fresnel(){
  if(typeof THREE === 'undefined' || !window.esfera || !window.scene) return;
  if(window._v11Fresnel) return;
  var R = (typeof R_ESF !== 'undefined' ? R_ESF : 150) * 1.035;
  var mat = new THREE.ShaderMaterial({
    uniforms: { c:{value:new THREE.Color(0x8B5CF6)}, p:{value:3.2} },
    vertexShader:
      'varying float vI;\n' +
      'uniform float p;\n' +
      'void main(){\n' +
      '  vec3 n = normalize(normalMatrix * normal);\n' +
      '  vec3 v = normalize((modelViewMatrix * vec4(position,1.0)).xyz);\n' +
      '  vI = pow(1.0 - abs(dot(n, -v)), p);\n' +
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);\n' +
      '}',
    fragmentShader:
      'varying float vI;\n' +
      'uniform vec3 c;\n' +
      'void main(){ gl_FragColor = vec4(c, vI * 0.55); }',
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false
  });
  var rim = new THREE.Mesh(new THREE.SphereGeometry(R, 60, 40), mat);
  rim.renderOrder = 2;
  /* mismo padre y posición que la esfera: viaja con ella */
  (window.esfera.parent || window.scene).add(rim);
  rim.position.copy(window.esfera.position);
  window._v11Fresnel = rim;
}
if(document.readyState === 'complete') _fresnel();
else window.addEventListener('load', _fresnel);

console.log('[juice] E4 activo · grano+viñeta+aberración' +
  (window.esfera ? ' + fresnel' : ''));
})();
