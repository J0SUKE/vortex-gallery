attribute vec3 aInstancePosition;

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

    // Compute angle from instance position
    float angle = atan(aInstancePosition.y, aInstancePosition.x);

    // Quaternion representation: q = (cos(theta/2), sin(theta/2) * axis)
    float halfAngle = 1.5 * 3.14159265359 + angle;
    vec3 axis = vec3(0.0, 0.0, 1.0);
    float s = sin(halfAngle * 0.5);
    vec4 quaternion = getQuaternionFromAxisAngle(axis, halfAngle);

    // Adjust for internal rotation (90° around X-axis)
    float halfAngleX = 3.14159265359 * 0.5;
    vec3 axisX = vec3(1.0, 0.0, 0.0);
    vec4 quaternionX = getQuaternionFromAxisAngle(axisX, halfAngleX);
        

     vec4 finalQuaternion = multiplyQuaternions(quaternion,quaternionX);
    
    vec3 finalPosition = scaledPosition +
        2.0 * cross(finalQuaternion.xyz, cross(finalQuaternion.xyz, scaledPosition) + finalQuaternion.w * scaledPosition);

    // Apply instance translation
    vec4 modelPosition = modelMatrix * vec4(aInstancePosition + finalPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
}