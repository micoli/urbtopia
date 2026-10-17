import * as THREE from 'three';

const SATURATION = 1.4;

THREE.ShaderChunk.color_fragment += `
  {
    float albedoLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    diffuseColor.rgb = max(vec3(albedoLuma) + (diffuseColor.rgb - vec3(albedoLuma)) * ${SATURATION.toFixed(2)}, 0.0);
  }
`;
