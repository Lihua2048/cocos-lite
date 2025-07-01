// SDF 字体着色器源码
export const sdfVertexShader = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform mat4 u_projectionMatrix;
varying vec2 v_texCoord;
void main() {
  gl_Position = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

export const sdfFragmentShader = `
precision mediump float;
uniform sampler2D u_fontTexture;
uniform vec4 u_textColor;
varying vec2 v_texCoord;
void main() {
  float sdf = texture2D(u_fontTexture, v_texCoord).a;
  float alpha = smoothstep(0.5 - 0.1, 0.5 + 0.1, sdf);
  gl_FragColor = vec4(u_textColor.rgb, u_textColor.a * alpha);
}
`;
