varying vec2 vUv;
uniform sampler2D uTexture;
varying vec3 vNormal;

void main()
{                
    // Sample the texture
    vec4 color = texture2D(uTexture, vUv);

    float fullWhite = mix(0.,1.1,(color.r + color.g + color.b)/3.);
    fullWhite = floor(fullWhite);
    
    float normalZ = vNormal.z;
    color.rgb*=abs(vNormal.z);    

    color.a*=(1.-fullWhite) * abs(vNormal.z);


    gl_FragColor = color;
}