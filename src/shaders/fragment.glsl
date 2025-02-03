varying vec2 vUv;
uniform sampler2D uAtlas;
varying float vAlpha;
varying vec4 vTextureCoords;
varying float vOpacity;

void main()
{
        
    // Get UV coordinates for this image from the uniform array
    float xStart = vTextureCoords.x;
    float xEnd = vTextureCoords.y;
    float yStart = vTextureCoords.z;
    float yEnd = vTextureCoords.w;
    
    // Transform the default UV coordinates to sample from the correct part of the atlas
    vec2 atlasUV = vec2(
        mix(xStart, xEnd, vUv.x),
        mix(yStart, yEnd, 1.-vUv.y)
    );
    
    // Sample the texture
    vec4 color = texture2D(uAtlas, atlasUV);
    
    // if alpha != 1 then just pass a black texture (avoid bleeding effect)
    
    color.rgb = (1.-floor(vAlpha))*vec3(1.-vAlpha) + (floor(vAlpha))*color.rgb;

    color.a = vOpacity;

    gl_FragColor = color;

}