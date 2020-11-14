import React, { useEffect, useRef } from 'react';
import * as THREE from "three"

import "./App.css";

/*
  - Interaction API
  - FBXLoader
  - Scene
    - Avatar
      - AnimationMixer
*/

let scene:any, camera:any, renderer:any;

function App() {
  const mount = useRef<HTMLDivElement>(null);

  /**
   * Effects
   */

  useEffect(() => {
    const width = mount?.current?.offsetWidth || 1;
    const height = mount?.current?.offsetHeight || 1;

    // Scene
    scene = new THREE.Scene();
  
    // Camera
    camera = new THREE.PerspectiveCamera(45, width / height);
    camera.position.set(0, 0, 0);
    // camera.rotateX(100);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    mount?.current?.appendChild(renderer.domElement);

    // Lights
    const hemisLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemisLight.position.set(0, 0, 0);
    scene.add(hemisLight);

    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(0, 2000, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 0;
    dirLight.shadow.camera.bottom = 0;
    dirLight.shadow.camera.left = 0;
    dirLight.shadow.camera.right = 1200;
    scene.add(dirLight);

    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    const cube = new THREE.Mesh( geometry, material );
    scene.add(cube);
    
    camera.position.z = 5;
    
    const animate = function () {
      requestAnimationFrame( animate );
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render( scene, camera );
    };
    animate();

    window.addEventListener("resize", onWindowResize, false);

    // Destroy
    let currentMount = mount?.current;
    return () => {
      window.removeEventListener("resize", onWindowResize);
      currentMount?.removeChild(renderer.domElement);
    };
  }, []);

  /**
   * Event handlers
   */

  const onWindowResize = () => {
    const width = mount?.current?.offsetWidth || 1;
    const height = mount?.current?.offsetHeight || 1;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer && renderer.setSize(width, height);
  };

  return (
    <div className="App">
      <div id="scene" ref={mount} />
    </div>
  );
}

export default App;
