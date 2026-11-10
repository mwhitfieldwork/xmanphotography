/* ==========================================================================
   WHAT: The shader (graphics-card program) that rips a print in two.
   WHY:  Moving the mesh points gives real 3D peeling rather than a flat wipe.
   HOW:  One print is drawn as two meshes, a left half and a right half.
         uP is progress from 0 to 1. The rip starts at the top and travels down.
         Each half keeps only its side of a jagged line, and shows white paper
         fibers along that edge. You should not need to edit this file.
   ========================================================================== */
const NOISE = `
float h1(float x){return fract(sin(x*127.1)*43758.5453);}
float vn(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h1(i),h1(i+1.),f);}
float tearLine(float y,float s){y+=s;return .5+(vn(y*3.)-.5)*.17+(vn(y*11.)-.5)*.055+(vn(y*47.)-.5)*.02+(vn(y*140.)-.5)*.008;}`;
export const TEAR_VERTEX = NOISE + `
uniform float uP,uSide,uSeed; varying vec2 vUv; varying float vS;
void main(){
  vUv=uv;
  float d=1.-uv.y;
  float l=clamp(uP*2.1-d*1.1,0.,1.); l=l*l*(3.-2.*l);
  float off=(uv.x-tearLine(uv.y,uSeed))*uSide;
  float e=1.-clamp(off*2.,0.,1.);
  vec3 p=position;
  p.x+=uSide*l*(.03+.17*e*e);
  p.y+=l*.03*e*e;
  p.z+=l*e*e*.05;
  float f=smoothstep(.6,1.,uP);
  float a=-uSide*f*.6; vec2 pv=vec2(uSide*.5,-.5); vec2 q=p.xy-pv;
  p.xy=vec2(q.x*cos(a)-q.y*sin(a),q.x*sin(a)+q.y*cos(a))+pv;
  p.x+=uSide*f*.95; p.y-=f*f*2.1; p.z+=f*.06;
  vS=l*e*e;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
export const TEAR_FRAGMENT = NOISE + `
uniform sampler2D uMap; uniform float uP,uSide,uSeed,uDim,uA; uniform vec2 uM; varying vec2 vUv; varying float vS;
void main(){
  float off=(vUv.x-tearLine(vUv.y,uSeed))*uSide;
  float l=clamp(uP*2.1-(1.-vUv.y)*1.1,0.,1.);
  if(off<0.) discard;
  float aa=l>0.?smoothstep(0.,.0016,off):1.;
  vec3 paper=vec3(1.,.995,.98);
  vec2 inner=(vUv-uM)/(1.-2.*uM);
  bool img=inner.x>0.&&inner.x<1.&&inner.y>0.&&inner.y<1.;
  vec3 c=img?texture2D(uMap,inner).rgb:paper;
  float w=.016*(.35+vn(vUv.y*90.+uSeed))*smoothstep(0.,.06,l);
  if(off<w) c=paper*(.88+.12*vn(vUv.y*400.));
  c*=1.-.42*vS;
  c+=.1*vS*smoothstep(.2,.8,vS);
  gl_FragColor=vec4(c*uDim,uA*aa);
}`;

