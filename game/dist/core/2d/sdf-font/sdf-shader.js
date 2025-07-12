// SDF 字体着色器源码
export const sdfVertexShader = `
attribute vec4 a_position;
attribute vec2 a_texCoord;
uniform mat4 u_projectionMatrix;
varying vec2 v_texCoord;
void main() {
  gl_Position = u_projectionMatrix * a_position;
  v_texCoord = a_texCoord;
}
`;
export const sdfFragmentShader = `
precision mediump float;
uniform sampler2D u_fontTexture;
uniform vec4 u_textColor;
varying vec2 v_texCoord;
// median 实现
float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}
void main() {
  vec3 sample = texture2D(u_fontTexture, v_texCoord).rgb;
  float sigDist = median(sample.r, sample.g, sample.b);
  float alpha = smoothstep(0.5 - 0.1, 0.5 + 0.1, sigDist);
  gl_FragColor = vec4(u_textColor.rgb, u_textColor.a * alpha);
}
`;
//# sourceMappingURL=sdf-shader.js.map