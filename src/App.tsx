import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AnimationMixer, Object3D } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

import "./App.css";

/*
  - Interaction API
  - FBXLoader
  - Scene
    - Avatar
      - AnimationMixer
*/

let scene: any, camera: any, renderer: any, mixer: any;

let frameId: number;

let animations: any = {};

const clock = new THREE.Clock();

interface IMixers {
  [mixer: string]: AnimationMixer;
}

let mixers: IMixers = {};

const MODEL_TEMP = "./models/Male/SK_MBeachwear.fbx";
const ANIMATION_TEMP = "./models/Animations/Anim_CheeringIdle.fbx";

function App() {
  const mount = useRef<HTMLDivElement>(null);

  const setupScene = () => {
    const width = mount?.current?.offsetWidth || 1;
    const height = mount?.current?.offsetHeight || 1;

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(45, width / height);
    camera.position.set(0, 0, 100);
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
  };

  const animate = () => {
    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(animate);

    if (clock) {
      Object.keys(mixers).forEach((mixer) => {
        const delta = clock.getDelta();
        mixers[mixer].update(delta);
      });
    }

    if (mixer && clock) {
      const delta = clock.getDelta();
      mixer.update(delta);
    }
  };

  const start = () => {
    if (!frameId) {
      frameId = requestAnimationFrame(animate);
    }
  };

  const setupBox = () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const animate = function () {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      // renderer.render( scene, camera );
    };
    animate();
  };

  const setupAvatar = () => {
    return new Promise((resolve, reject) => {
      const loader = new FBXLoader();

      const onLoad = (object: Object3D) => {
        console.log("avatar", object);
        object.position.set(0, 0, 0);
        object.scale.set(0.1, 0.1, 0.1);

        // Mixer
        const animsKeys = Object.keys(animations);
        console.log("animsKeys: ", animsKeys);
        console.log("animations: ", animations);
        if (animsKeys.length) {
          mixer = new THREE.AnimationMixer(object);
          const action = mixer.clipAction(animations[animsKeys[0]]); // or 1?
          action.play();
        }

        // * Tweak lighting on materials
        object.traverse(function (child: Object3D) {
          if (child instanceof THREE.Mesh) {
            child.material.shininess = 0;
          }
        });

        scene.add(object);

        // Debug animation
        const animate = function () {
          requestAnimationFrame(animate);
          object.rotation.x += 0.01;
          object.rotation.y += 0.01;
          renderer.render(scene, camera);
        };
        animate();

        resolve();
      };

      const onLoading = (xhr: any) => {
        console.log(
          "loading: ",
          `${((xhr.loaded / xhr.total) * 100).toFixed(2)}%`
        );
      };

      const onLoaderError = function (error: ErrorEvent) {
        console.error(error);
        reject();
      };

      loader.load(MODEL_TEMP, onLoad, onLoading, onLoaderError);
    });
  };

  const setupAnimation = () => {
    const loader = new FBXLoader();
    loader.load(ANIMATION_TEMP, (object) => {
      console.log("animation", object);

      animations = {
        ...animations,
        //@ts-ignore
        [`anim-${object.id}`]: object.animations[0],
      };

      // const action = mixer.clipAction(object.animations[0]);
      // action.play();
    });
  };

  /**
   * Effects
   */

  useEffect(() => {
    setupScene();
    start();
    setupBox();
    setupAvatar();
    setupAnimation();

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
