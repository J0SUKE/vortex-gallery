varying vec2 vUv;
uniform sampler2D uAtlas;
uniform float uImageData[40];  // 5 values per image (xStart, xEnd, yStart, yEnd, aspectRatio) * 8 images
varying float vImageIndex;
varying float vAlpha;

void main()
{
    
    int idx = int(vImageIndex);
    
    // Calculate the base offset for this image's data in the uImageData array
    int offset = idx * 5;
    
    // Get UV coordinates for this image from the uniform array
    float xStart = uImageData[offset];
    float xEnd = uImageData[offset + 1];
    float yStart = uImageData[offset + 2];
    float yEnd = uImageData[offset + 3];
    float aspectRatio = uImageData[offset + 4];
    
    // Transform the default UV coordinates to sample from the correct part of the atlas
    vec2 atlasUV = vec2(
        mix(xStart, xEnd, vUv.x),
        mix(yStart, yEnd, vUv.y)
    );
    
    // Sample the texture
    vec4 color = texture2D(uAtlas, atlasUV);
    color.a = vAlpha;
    gl_FragColor = color;
}