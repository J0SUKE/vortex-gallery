#define PI 3.14159265359

attribute float aAngle;
attribute float aHeight;
attribute float aRadius;
attribute float aAspectRatio;
attribute float aAlpha;
attribute float aSpeed;
attribute vec4 aTextureCoords;
attribute vec2 aImageRes;

varying float vAlpha;
varying vec4 vTextureCoords;
varying vec2 vUv;
varying float vImageIndex;
varying float vAspectRatio;
varying float vOpacity;

uniform float uMaxZ;
uniform float uZrange;
uniform float uTime;
uniform float uScrollY;


vec4 getQuaternionFromAxisAngle(vec3 axis, float angle)
{
    float halfAngle = angle * 0.5;
    return vec4(axis.xyz * sin(halfAngle), cos(halfAngle));
}

vec4 multiplyQuaternions(vec4 q1, vec4 q2) {
    return vec4(
        q1.w * q2.xyz + q2.w * q1.xyz + cross(q1.xyz, q2.xyz),
        q1.w * q2.w - dot(q1.xyz, q2.xyz)
    );
}

void main() {
    vec3 scaledPosition = position;

    scaledPosition.y/=aAspectRatio;

    float zPos = aHeight + uScrollY;
    float zRange = uZrange; 
    float minZ = (uMaxZ - uZrange); // Min z position
    // Wrap around the z position
    zPos = mod(zPos - minZ, zRange) + minZ;

    vOpacity = smoothstep(minZ,minZ+40.,zPos);



    vec3 instancePosition = vec3(cos(aAngle + uTime*aSpeed) * aRadius, sin(aAngle + uTime*aSpeed) * aRadius, zPos);

    // Compute angle from instance position
    float angle = atan(instancePosition.y, instancePosition.x);

    // Quaternion representation: q = (cos(theta/2), sin(theta/2) * axis)
    float halfAngle = 1.5 * PI + angle;
    vec3 axis = vec3(0.0, 0.0, 1.0);
    float s = sin(halfAngle * 0.5);
    vec4 quaternion = getQuaternionFromAxisAngle(axis, halfAngle);

    // Adjust for internal rotation (90° around X-axis)
    float halfAngleX = PI * 0.5;
    vec3 axisX = vec3(1.0, 0.0, 0.0);
    vec4 quaternionX = getQuaternionFromAxisAngle(axisX, halfAngleX);
        

     vec4 finalQuaternion = multiplyQuaternions(quaternion,quaternionX);
    
    vec3 finalPosition = scaledPosition +
        2.0 * cross(finalQuaternion.xyz, cross(finalQuaternion.xyz, scaledPosition) + finalQuaternion.w * scaledPosition);

    // Apply instance translation
    vec4 modelPosition = modelMatrix * vec4(instancePosition + finalPosition, 1.0);    

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;  

    vUv=uv;
    vAlpha=aAlpha;
    vTextureCoords = aTextureCoords;
    vAspectRatio = aAspectRatio;
}