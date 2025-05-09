
varying vec2 vUv;
uniform sampler2D uAtlas;
uniform vec4 uTextureCoords;

void main()
{
    
    float xStart = uTextureCoords.x;
    float xEnd = uTextureCoords.y;
    float yStart = uTextureCoords.z;
    float yEnd = uTextureCoords.w;
    
    // Transform the default UV coordinates to sample from the correct part of the atlas
    vec2 atlasUV = vec2(
        mix(xStart, xEnd, vUv.x),
        mix(yStart, yEnd, 1.-vUv.y)
    );
    
    // Sample the texture
    vec4 color = texture2D(uAtlas, atlasUV);
    
    gl_FragColor = color;
}