varying vec2 vUv;
uniform sampler2D uTexture;
varying vec3 vNormal;

void main() {    

    vec4 color = texture2D(uTexture, uv);

    float fullWhite = mix(0.,1.1,(color.r + color.g + color.b)/3.);
    fullWhite = floor(fullWhite);

    vec3 sPos = position;
    
    vec4 modelPosition = modelMatrix * vec4(sPos, 1.0);  
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;  

    vUv=uv;    

    vec4 modelNormal = modelMatrix*vec4(normal,0.);
    vNormal=modelNormal.xyz;
}