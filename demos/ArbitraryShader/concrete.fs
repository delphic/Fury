#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoordinates;
varying vec2 pos;

uniform float time;
uniform vec2 mouse;
uniform int mouseLeft;
uniform sampler2D tex0;
  
void main() {
  float v1 = (sin(vTextureCoordinates.s+time) + 1.0) / 2.0;
  float v2 = (cos(vTextureCoordinates.t+time) + 1.0) / 2.0;

  float d = distance(mouse, pos);
  
  vec2 tt = vec2(vTextureCoordinates.s+sin(time/10.0), vTextureCoordinates.t+cos(time/10.0));
  vec4 c1 = texture2D(tex0, tt) * 1.1;

  float avg = (c1.r+c1.g+c1.b)/3.0;
  float r = c1.r+v1*pow(avg,4.0) - pow(d,pow(avg,2.0) +float(mouseLeft)*avg);
  float g = c1.g+v2*pow(avg,4.0) - pow(d,pow(avg,2.0) +float(mouseLeft)*avg);
  float b = c1.g - pow(d,pow(avg,2.0) +float(mouseLeft)*avg);

  gl_FragColor = vec4(r, g, b, 1.0);
}
