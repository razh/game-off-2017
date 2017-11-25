import Bloom from './Bloom.js';
import Controls from './Controls.js';
import pointerLock from './pointerLock.js';

const { THREE, CANNON } = window;

let container;

let scene;
let camera;
let renderer;

let bloom;

let world;

let sphereMesh;
let sphereBody;

const clock = new THREE.Clock();
let running = false;

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  renderer.shadowMap.enabled = true;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
  );
  const controls = new Controls(camera);
  pointerLock(controls).addEventListener('change', event => {
    if (event.enabled) {
      running = true;
      // eslint-disable-next-line no-use-before-define
      animate();
    }
  });
  controls.getObject().position.set(8, 8, 8);
  scene.add(controls.getObject());

  bloom = new Bloom(renderer, scene, camera);

  scene.add(new THREE.AmbientLight('#777'));

  const light = new THREE.DirectionalLight();
  light.position.set(8, 8, 8);
  light.castShadow = true;
  scene.add(light);

  const groundMesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(32, 32),
    new THREE.MeshStandardMaterial(),
  );
  groundMesh.rotateX(-Math.PI / 2);
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  const sphereRadius = 1;
  sphereMesh = new THREE.Mesh(
    new THREE.IcosahedronBufferGeometry(sphereRadius, 3),
    new THREE.MeshStandardMaterial(),
  );
  sphereMesh.position.y = 16;
  sphereMesh.castShadow = true;
  sphereMesh.receiveShadow = true;
  scene.add(sphereMesh);

  world = new CANNON.World();
  world.gravity.set(0, -10, 0);

  const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
  });
  groundBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(1, 0, 0),
    -Math.PI / 2,
  );
  world.addBody(groundBody);

  sphereBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3().copy(sphereMesh.position),
    shape: new CANNON.Sphere(sphereRadius),
  });
  world.addBody(sphereBody);
}

const update = (() => {
  const dt = 1 / 60;
  let accumulatedTime = 0;

  return () => {
    const frameTime = Math.min(clock.getDelta(), 0.1);
    accumulatedTime += frameTime;

    while (accumulatedTime >= dt) {
      world.step(dt);
      accumulatedTime -= dt;
    }

    sphereMesh.position.copy(sphereBody.position);
    sphereMesh.quaternion.copy(sphereBody.quaternion);
  };
})();

function render() {
  bloom.render();
}

function animate() {
  update();
  render();

  if (running) {
    requestAnimationFrame(animate);
  }
}

init();
animate();

document.addEventListener('keydown', event => {
  // Pause/play.
  if (event.code === 'KeyP') {
    running = !running;
    if (running) {
      animate();
    }
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  bloom.setSize(window.innerWidth, window.innerHeight);
  render();
});
