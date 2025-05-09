#define PI 3.14159265359

attribute float aAngle;
attribute float aHeight;
attribute float aRadius;
attribute float aAspectRatio;
attribute float aSpeed;
attribute vec4 aTextureCoords;
attribute vec2 aImageRes;


varying vec4 vTextureCoords;
varying vec2 vUv;
varying float vImageIndex;
varying float vAspectRatio;

uniform float uMaxZ;
uniform float uZrange;
uniform float uTime;
uniform float uScrollY;
uniform float uSpeedY;
uniform float uDirection;


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
    // // Wrap around the z position
    zPos = mod(zPos - minZ, zRange) + minZ;



    float theta = aAngle + uSpeedY*0.4*aSpeed;
    
    vec3 instancePosition = vec3(cos(theta) * aRadius, zPos, sin(theta) * aRadius);

    // Compute angle from instance position
    float angle = atan(instancePosition.x, instancePosition.z);    

    // Apply a quaternion rotation around the Y axis of angle - PI/2
    vec4 rotation = getQuaternionFromAxisAngle(vec3(0.0, 1.0, 0.0), angle);

    //apply the queternion rotation to the instance position
    


    vec3 finalPosition = scaledPosition +
        2.0 * cross(rotation.xyz, cross(rotation.xyz, scaledPosition) + rotation.w * scaledPosition);;

    // Apply instance translation
    vec4 modelPosition = modelMatrix * vec4(instancePosition + finalPosition, 1.0);    

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;  

    vUv=uv;
    vTextureCoords = aTextureCoords;
    vAspectRatio = aAspectRatio;
}