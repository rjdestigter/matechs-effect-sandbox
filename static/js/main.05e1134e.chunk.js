(this["webpackJsonpmatechs-canvas"]=this["webpackJsonpmatechs-canvas"]||[]).push([[0],{137:function(e,n,t){e.exports=t(163)},142:function(e,n,t){},143:function(e,n,t){},147:function(e,n){},149:function(e,n){},163:function(e,n,t){"use strict";t.r(n);var r=t(3),c=t.n(r),a=t(38),i=t.n(a),o=(t(142),t(2)),u=(t(143),function(){for(var e=arguments.length,n=new Array(e),t=0;t<e;t++)n[t]=arguments[t];return n}),s=t(4),l=t(39),f=t(0),p=t(22),m=t(9),d=t(6),b=t(7),h=t(1),y=t(8),v=t(11),O=function(e){return function(n){return n[e]}},j=function(e,n){return function(t){return t[e][n]}},g=O,E=(j("detail","value"),t(5)),k=t(28),w=function(e){return f.a.sync((function(){return e()}))},S=function(e){return Object(v.Do)(f.a.effect).bind("r",w(m.randomInt(0,255))).bind("g",w(m.randomInt(0,255))).bind("b",w(m.randomInt(0,255))).bind("a",null!=e?f.a.pure(e):w(Object(h.pipe)(m.randomInt(0,10),k.map((function(e){return e/10}))))).return((function(e){var n=e.r,t=e.g,r=e.b,c=e.a;return"rgba(".concat(n,", ").concat(t,", ").concat(r,", ").concat(c,")")}))};function P(e){return function(n){return function(e,n){var t=f.e.as({type:"until"})(f.e.encaseEffect(n)),r=Object(h.pipe)(e,f.e.map((function(e){return{type:"stream",value:e}})));return Object(h.pipe)(f.e.mergeAll([t,r]),f.e.takeWhile((function(e){return"stream"===e.type})),f.e.filter((function(e){return"stream"===e.type})),f.e.map((function(e){return e.value})))}(n,e)}}var M="@uri/canvas",I=function(e){return{type:"@instruction-group",instructions:e}},R=f.a.accessM((function(e){return e[M].clearRect()})),C=f.a.accessM((function(e){return e[M].canvas})),T=function(e){return function(n){return null!=n?f.a.pure(n):function(e){return Object(h.pipe)(C,f.a.map((function(n){return n[e]})))}(e)}},L=T("width"),W=T("height"),X=function(e){return function(n,t,r,c){return Object(v.Do)(f.a.effect).bind("width",L(r)).bind("height",W(c)).doL((function(r){var c=r.width,a=r.height;return f.a.sync((function(){return e.clearRect(n||0,t||0,c,a)}))})).return((function(e){var r=e.width,c=e.height;return{type:"@instruction/clearRect",args:u(n||0,t||0,r,c)}}))}},B=function(e){return f.a.accessM((function(n){var t=n[M];switch(e.type){case"@instruction-group":return Object(h.pipe)(G(e.instructions),f.a.map(I));case"@instruction/arc":return t.arc.apply(t,Object(s.a)(e.args));case"@instruction/lineTo":return t.lineTo.apply(t,Object(s.a)(e.args));case"@instruction/moveTo":return t.moveTo.apply(t,Object(s.a)(e.args));case"@instruction/save":return t.save;case"@instruction/restore":return t.restore;case"@instruction/beginPath":return t.beginPath;case"@instruction/closePath":return t.closePath;case"@instruction/clearRect":return t.clearRect.apply(t,Object(s.a)(e.args));case"@instruction/fill":return t.fill;case"@instruction/fillStyle":return t.fillStyle.apply(t,Object(s.a)(e.args));case"@instruction/lineWidth":return t.lineWidth.apply(t,Object(s.a)(e.args));case"@instruction/stroke":return t.stroke;case"@instruction/strokeStyle":return t.strokeStyle.apply(t,Object(s.a)(e.args))}}))},G=function(e){return Object(h.pipe)(e,d.map(B),d.array.sequence(f.a.effect))},q=function(e){var n=Object(o.a)(e,2),t=n[0],r=n[1];return f.a.accessM((function(e){return e[M].moveTo(t,r)}))},A=function(e){var n=Object(o.a)(e,2),t=n[0],r=n[1];return f.a.accessM((function(e){return e[M].lineTo(t,r)}))},D=f.a.accessM((function(e){return e[M].beginPath})),Y=f.a.accessM((function(e){return e[M].closePath})),x=f.a.accessM((function(e){return e[M].stroke})),J=function(e){return f.a.accessM((function(n){return e(n[M])}))},z=function(e,n){return f.e.fromSource(f.c.managed.chain(f.c.bracket(f.a.accessM((function(t){return f.a.sync((function(){var r=f.e.su.queueUtils(),c=r.next,a=r.ops,i=r.hasCB;return{unsubscribe:(n?t["@uri/emitter"].addEventListener(n):t["@uri/emitter"].fromEvent)(e)((function(e){return c({_tag:"offer",a:e})})),ops:a,hasCB:i}}))})),g("unsubscribe")),(function(e){var n=e.ops,t=e.hasCB;return f.e.su.emitter(n,t)})))},U=function(e){return function(n){return n.charCodeAt(e)}},Z=function(e){return u(e.offsetX,e.offsetY)},$=function(e){return Object(h.pipe)(f.a.accessM((function(e){return e[M].canvas})),f.e.encaseEffect,f.e.chain((function(e){return z("click",e)})),f.e.map(Z),f.e.chain(Object(y.flow)(e,f.e.encaseEffect)))},_=$((function(e){var n=Object(o.a)(e,2),t=n[0],r=n[1];return Object(h.pipe)(m.randomInt(30,200),w,f.a.chain((function(e){return function(e,n,t,r,c){return f.a.accessM((function(a){var i=a[M];return Object(h.pipe)(f.a.zip(r?f.a.pure(r):w(m.randomInt(0,360)),c?f.a.pure(c):w(m.randomInt(Math.PI/10*1e3,1e3*Math.PI))),f.a.chain((function(r){var c=Object(o.a)(r,2),a=c[0],u=c[1],s=[Object(h.pipe)(S(1),f.a.chain(i.strokeStyle)),Object(h.pipe)(S(),f.a.chain(i.fillStyle)),i.lineWidth(2),i.beginPath,i.arc(e,n,t,a,u/1e3),i.stroke,i.fill];return d.array.sequence(f.a.effect)(s)})))}))}(t,r,e)})),f.a.map((function(e){return I(e)})))})),F=function(e){var n=Object(o.a)(e,2),t=n[0],r=n[1];return J((function(e){return Object(h.pipe)([e.beginPath,e.arc(t,r,3,0,2*Math.PI),e.strokeStyle("#000000"),e.fillStyle("#ffffff"),e.lineWidth(2),e.stroke,e.fill],d.array.sequence(f.a.effect),f.a.map(I))}))},H=$(F),K=function(e){return Object(h.pipe)(e,f.e.take(1),f.e.collectArray,f.a.map((function(e){return Object(o.a)(e,1)[0]})))},N=function(e){var n=Object(h.pipe)(e,d.map(B),d.array.sequence(f.a.effect));return Object(h.pipe)(f.d.makeRef({coords:[],instructionGroup:b.none}),f.e.encaseEffect,f.e.chain((function(e){return Object(h.pipe)(K(z("click")),f.a.map(Z),f.a.chain((function(n){return e.set({coords:[n],instructionGroup:b.none})})),f.e.encaseEffect,f.e.chain(Object(y.constant)(Object(h.pipe)(f.a.race(K(z("click")),K(z("mousemove"))),f.a.chain((function(n){return Object(h.pipe)(n,Z,(function(t){return"click"===n.type?Object(h.pipe)(e.update((function(e){var n=e.coords,r=e.instructionGroup;return{coords:[].concat(Object(s.a)(n),[t]),instructionGroup:r}})),f.a.map(g("coords"))):Object(h.pipe)(e.get,f.a.map((function(e){var n=e.coords;return[].concat(Object(s.a)(n),[t])})))}),f.a.map((function(e){return u(n.type,e)})))})),f.a.chain((function(t){var r=Object(o.a)(t,2),c=r[0],a=r[1];return Object(v.Do)(f.a.effect).do(R).do(n).bind("polygonInstructions",function(e){var n,t=Object(l.a)(e),r=t[0],c=t.slice(1);return Object(h.pipe)(d.array.sequence(f.a.effect)(Object(h.pipe)([D,(n=1,f.a.accessM((function(e){return e[M].lineWidth(n)}))),J((function(e){return e.strokeStyle("#000")})),q(r)].concat(Object(s.a)(c.map(A)),[Y,x,F(r)],Object(s.a)(c.map(F))))),f.a.map(I))}(a)).doL((function(n){var t=n.polygonInstructions;return"click"===c&&a.length>2?e.update((function(e){var n=e.coords;e.instructionGroup;return{coords:n,instructionGroup:b.some(t)}})):f.a.pure(1)})).done()})),f.e.encaseEffect,f.e.repeat))),f.e.chain(Object(y.constant)(Object(h.pipe)(e.get,f.a.map(g("instructionGroup")),f.e.encaseEffect))))})))},Q=function(e){return Object(h.pipe)(z("keyup"),f.e.map(g("keyCode")),f.e.filter(e.includes.bind(e)),f.e.take(1),f.e.collectArray,f.a.map((function(e){return Object(o.a)(e,1)[0]})),f.a.map(String.fromCharCode))},V=Object(h.pipe)(["1","2","3","R","X"],d.map(U(0)),Q),ee=Object(h.pipe)(["S","X"],d.map(U(0)),Q),ne=function(e){return Object(h.pipe)(f.a.parZip(Object(h.pipe)(e,P(ee),f.e.collectArray),ee),f.a.map((function(e){var n=Object(o.a)(e,2),t=n[0];return"S"===n[1]?b.some(t):b.none})))},te=Object(v.Do)(f.a.effect).bind("stateRef",f.d.makeRef({instructions:[]})).doL((function(e){var n=e.stateRef;return f.a.forever(Object(v.Do)(f.a.effect).do(R).do(Object(h.pipe)(n.get,f.a.chain((function(e){return G(e.instructions)})))).bind("mainMenuChoice",V).bindL("additionalInstructions",(function(e){switch(e.mainMenuChoice){case"1":return ne(_);case"2":return ne(H);case"3":return Object(h.pipe)(ne(Object(h.pipe)(n.get,f.a.map(g("instructions")),f.e.encaseEffect,f.e.chain(N))),f.a.map((function(e){return Object(h.pipe)(e,b.chain((function(e){return Object(h.pipe)(e,d.reverse,(function(e){return Object(o.a)(e,1)[0]}))})),b.map(d.of))})));case"X":return f.a.as(n.update((function(){return{instructions:[]}})),b.none);default:return f.a.pure(b.none)}})).doL((function(e){var t=e.additionalInstructions;return console.log(t),Object(h.pipe)(t,b.map((function(e){return f.a.as(n.update((function(n){return{instructions:[].concat(Object(s.a)(n.instructions),Object(s.a)(e))}})),1)})),b.fold(Object(y.constant)(f.a.pure(1)),y.identity))})).done())})).done(),re=function(e){return r.useEffect((function(){if(e.current){var n=e.current.getContext("2d");n&&Object(h.pipe)(te,f.a.provideS((t=document,Object(E.a)({},"@uri/emitter",{fromEvent:function(e){return function(n){return t.addEventListener(e,n),f.a.sync((function(){return t.removeEventListener(e,n)}))}},addEventListener:function(e){return function(n){return function(t){return e.addEventListener(n,t),f.a.sync((function(){return e.removeEventListener(n,t)}))}}}}))),f.a.provideS(function(e){return Object(E.a)({},M,{canvas:f.a.pure(e.canvas),arc:function(n,t,r,c,a){var i=arguments.length>5&&void 0!==arguments[5]&&arguments[5];return f.a.as(f.a.sync((function(){return e.arc(n,t,r,c,a,i)})),{type:"@instruction/arc",args:[n,t,r,c,a,i]})},lineTo:function(n,t){return f.a.as(f.a.sync((function(){return e.lineTo(n,t)})),{type:"@instruction/lineTo",args:[n,t]})},moveTo:function(n,t){return f.a.as(f.a.sync((function(){return e.moveTo(n,t)})),{type:"@instruction/moveTo",args:[n,t]})},clearRect:X(e),beginPath:f.a.as(f.a.sync((function(){return e.beginPath()})),{type:"@instruction/beginPath"}),closePath:f.a.as(f.a.sync((function(){return e.closePath()})),{type:"@instruction/closePath"}),stroke:f.a.as(f.a.sync((function(){return e.stroke()})),{type:"@instruction/stroke"}),save:f.a.as(f.a.sync((function(){return e.save()})),{type:"@instruction/save"}),restore:f.a.as(f.a.sync((function(){return e.restore()})),{type:"@instruction/restore"}),fill:f.a.as(f.a.sync((function(){return e.fill()})),{type:"@instruction/fill"}),lineWidth:function(n){return f.a.as(f.a.sync((function(){e.lineWidth=Math.abs(n)})),{type:"@instruction/lineWidth",args:[n]})},strokeStyle:function(n){return f.a.as(f.a.sync((function(){e.strokeStyle=n})),{type:"@instruction/strokeStyle",args:[n]})},fillStyle:function(n){return f.a.as(f.a.sync((function(){e.fillStyle=n})),{type:"@instruction/fillStyle",args:[n]})}})}(n)),p.b,f.a.run)}var t}),[e])},ce=function(){var e=c.a.useRef(null),n=c.a.useState(u(0,0)),t=Object(o.a)(n,2),r=Object(o.a)(t[0],2),a=r[0],i=r[1],s=t[1];return c.a.useEffect((function(){setTimeout((function(){if(e.current&&e.current.parentElement){console.log(e.current.parentElement.getBoundingClientRect());var n=e.current.parentElement.getBoundingClientRect(),t=n.width,r=n.height;s(u(t,r))}}),1)}),[e,s]),u(c.a.createElement("canvas",{height:i,width:a,ref:e}),e)};var ae=function(){var e=ce(),n=Object(o.a)(e,2),t=n[0],r=n[1];return re(r),c.a.createElement("div",{id:"app"},c.a.createElement("section",null,t),c.a.createElement("footer",null,c.a.createElement("ul",null,c.a.createElement("li",null,"Press ",c.a.createElement("strong",null,"1"),' to enter "circles" mode. Once in this mode you can click anywhere to draw a random circle.',c.a.createElement("ul",null,c.a.createElement("li",null,"Press ",c.a.createElement("strong",null,"S")," to save or ",c.a.createElement("strong",null,"X")," to cancel. You will be taken back to main mode."))),c.a.createElement("li",null,"Press ",c.a.createElement("strong",null,"2"),' to enter "markers" mode. Once in this mode you can click anywhere to draw a yellow marker.',c.a.createElement("ul",null,c.a.createElement("li",null,"Press ",c.a.createElement("strong",null,"S")," to save or ",c.a.createElement("strong",null,"X")," to cancel. You will be taken back to main mode."))),c.a.createElement("li",null,"Press ",c.a.createElement("strong",null,"3"),' to enter "polygon" mode. Once in this mode you can click anywhere to draw a polygon.',c.a.createElement("ul",null,c.a.createElement("li",null,"Press ",c.a.createElement("strong",null,"S")," to save or ",c.a.createElement("strong",null,"X")," to cancel. You will be taken back to main mode."))),c.a.createElement("li",null,"Press ",c.a.createElement("strong",null,"X")," while in ",c.a.createElement("i",null,"main")," mode to clear the canvas.")),c.a.createElement("p",null,"Circles have a random radius, start angle, end angle, color and border color.")))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));i.a.render(c.a.createElement(c.a.StrictMode,null,c.a.createElement(ae,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[137,1,2]]]);
//# sourceMappingURL=main.05e1134e.chunk.js.map