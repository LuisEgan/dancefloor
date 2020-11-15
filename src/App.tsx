import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { AnimationMixer, Object3D } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

import "./App.css";

/*
  TODO:
    - FBX caching
    - Better animations with fade in and out?
*/

let scene: any, camera: any, renderer: any, mixer: any;

let frameId: number;

let animations: any = {};

const clock = new THREE.Clock();

interface IMixers {
  [mixer: string]: AnimationMixer;
}

let mixers: IMixers = {};

const AVATARS_DATA = [
  {
    base: "./models/Female/SK_FDress01.FBX",
    head: "./models/Female/SK_FHead.fbx",
    hair: "./models/Female/SK_FHair03.fbx",
  },
  {
    base: "./models/Female/SK_FDress01.FBX",
    head: "./models/Female/SK_FHead.fbx",
    hair: "./models/Female/SK_FHair03.fbx",
  },
];

const MODEL_TEMP = "./models/Male/SK_MBeachwear.fbx";
const ANIMATION_TEMP = "./models/Animations/Anim_CheeringIdle.fbx";
const ANIMATION_IDLE = "./models/Animations/Anim_BasicIdle.fbx";

const ANIMATIONS = {
  yelling: "./models/Animations/Anim_Yelling.fbx",
  dance1: "./models/Animations/Anim_Dance01.fbx",
  dance2: "./models/Animations/Anim_Dance02.fbx",
  dance3: "./models/Animations/Anim_Dance03.fbx",
  dance4: "./models/Animations/Anim_Dance04.fbx",
  dance5: "./models/Animations/Anim_Dance05.fbx",
  previewPose: "./models/Animations/Anim_PreviewPose.fbx",
  basicIdle: "./models/Animations/Anim_BasicIdle.fbx",
  cheeringIdle: "./models/Animations/Anim_CheeringIdle.fbx",
  clapping: "./models/Animations/Anim_Clapping.fbx",
};

const loadFBX = (fp: string) => {
  return new Promise((resolve, reject) => {
    const loader = new FBXLoader();

    const onLoad = (object: Object3D) => {
      // const animsKeys = Object.keys(animations);
      // console.log("animsKeys: ", animsKeys);
      // console.log("animations: ", animations);
      // if (animsKeys.length) {
      //   mixer = new THREE.AnimationMixer(object);
      //   const action = mixer.clipAction(animations[animsKeys[0]]); // or 1?
      //   action.play();
      // }
      object.traverse(function (child: Object3D) {
        if (child instanceof THREE.Mesh) {
          child.material.shininess = 0;
        }
      });
      resolve(object);
    };

    const onLoading = (xhr: any) => {
      console.log(
        "loading: ",
        `${((xhr.loaded / xhr.total) * 100).toFixed(2)}%`
      );
    };

    const onLoaderError = (error: any) => {
      console.log("onLoaderError", error);
      return reject(error);
    };

    loader.load(fp, onLoad, onLoading, onLoaderError);
  });
};

const buildAvatar = async (avatar: any) => {
  console.log("buildAvatar", avatar);

  const object: any = await loadFBX(avatar.base);
  const head: any = await loadFBX(avatar.head);
  const hair: any = await loadFBX(avatar.hair);
  const idleAnimation: any = await loadFBX(ANIMATION_IDLE);

  object.add(head);
  object.add(hair);

  console.log(object);

  const mixers = [
    new THREE.AnimationMixer(object),
    new THREE.AnimationMixer(head),
    new THREE.AnimationMixer(hair),
  ];

  let idleActions: any = [];
  mixers.forEach((mixer) => {
    mixer.addEventListener("finished", function (e) {
      console.log("finished", e);
    });
    const action = mixer.clipAction(idleAnimation.animations[0]);
    action.play();
    idleActions.push(action);
  });

  return {
    object,
    mixers,
    idle: {
      start: () => idleActions.forEach((a: any) => a.play()),
      stop: () => idleActions.forEach((a: any) => a.stop()),
    },
  };
};

function App() {
  const mount = useRef<HTMLDivElement>(null);

  let avatars: any = [];

  const setupScene = () => {
    const width = mount?.current?.offsetWidth || 1;
    const height = mount?.current?.offsetHeight || 1;

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(45, width / height);
    camera.position.set(0, 0, 500);
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
      const delta = clock.getDelta();
      for (let i = 0; i < avatars.length; i++) {
        if (!avatars[i].mixers) continue;
        for (let ii = 0; ii < avatars[i].mixers.length; ii++) {
          avatars[i].mixers[ii].update(delta);
        }
      }
    }
  };

  const start = () => {
    if (!frameId) {
      frameId = requestAnimationFrame(animate);
    }
  };

  const setupAvatars = async () => {
    for (let i = 0; i < AVATARS_DATA.length; i++) {
      let avatar = await buildAvatar(AVATARS_DATA[i]);
      avatar.object.position.set(i * 100, 0, 0);
      scene.add(avatar.object);
      avatars.push(avatar);
    }
  };

  const runAnimation = async (fp: any) => {
    const animation: any = await loadFBX(fp);
    avatars[0].idle.stop();
    const onFinished = () => {
      avatars[0].idle.start();
      avatars[0].mixers[0].removeEventListener(onFinished);
    };
    avatars[0].mixers[0].addEventListener("finished", onFinished);
    for (let i = 0; i < avatars[0].mixers.length; i++) {
      const action = avatars[0].mixers[i].clipAction(animation.animations[0]);
      action.setLoop(THREE.LoopRepeat, 1);
      action.play();
    }
  };

  const cheer = async () => {
    const animation: any = await loadFBX(ANIMATION_TEMP);
    avatars[0].idle.stop();
    const onFinished = () => {
      avatars[0].idle.start();
      avatars[0].mixers[0].removeEventListener(onFinished);
    };
    avatars[0].mixers[0].addEventListener("finished", onFinished);
    for (let i = 0; i < avatars[0].mixers.length; i++) {
      const action = avatars[0].mixers[i].clipAction(animation.animations[0]);
      action.setLoop(THREE.LoopRepeat, 1);
      action.play();
    }
  };

  /**
   * Effects
   */

  useEffect(() => {
    setupScene();
    start();
    setupAvatars();

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

  console.log(Object.keys(ANIMATIONS));

  return (
    <div className="App">
      <button onClick={() => avatars[0].idle.stop()}>stop idle</button>
      <button onClick={() => avatars[0].idle.start()}>start idle</button>
      {Object.keys(ANIMATIONS).map((k: any) => {
        //@ts-ignore
        return <button onClick={() => runAnimation(ANIMATIONS[k])}>{k}</button>;
      })}
      <div id="scene" ref={mount} />
    </div>
  );
}

export default App;
