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

let playerObject;
let playerBody;
let sphereMesh;
let sphereBody;

const clock = new THREE.Clock();
let running = false;

const keys = {};

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
    if (event.enabled && !running) {
      running = true;
      // eslint-disable-next-line no-use-before-define
      animate();
    }
  });

  playerObject = new THREE.Object3D();
  playerObject.add(controls.getObject());
  playerObject.position.set(8, 8, 8);
  playerObject.update = (() => {
    const defaultSpeed = 16;
    const velocity = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();

    return dt => {
      let x = 0;
      let z = 0;

      if (keys.KeyW || keys.ArrowUp) z--;
      if (keys.KeyS || keys.ArrowDown) z++;
      if (keys.KeyA || keys.ArrowLeft) x--;
      if (keys.KeyD || keys.ArrowRight) x++;

      // Rotate playerBody about y-axis.
      controls.getEuler(rotation);
      playerBody.quaternion.setFromEuler(0, rotation.y, 0, rotation.order);

      if (!x && !z) {
        return;
      }

      velocity
        .set(x, 0, z)
        .applyQuaternion(controls.getQuaternion(quaternion))
        .setY(0)
        .normalize();

      let speed = defaultSpeed;
      if (keys.ShiftLeft || keys.ShiftRight) {
        speed *= 2;
      }

      // Translate playerBody.
      playerObject.translateOnAxis(velocity, speed * dt);
      playerBody.position.copy(playerObject.position);
    };
  })();
  scene.add(playerObject);

  bloom = new Bloom(renderer, scene, camera);

  scene.add(new THREE.AmbientLight('#333'));

  const light = new THREE.SpotLight();
  light.position.set(16, 16, 16);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;

  scene.add(new THREE.SpotLightHelper(light));
  scene.add(light);

  const size = 64;
  const groundMesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(size, size),
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

  playerBody = new CANNON.Body({
    mass: 10,
    position: new CANNON.Vec3().copy(playerObject.position),
    shape: new CANNON.Box(new CANNON.Vec3(1, 2, 1)),
  });
  world.addBody(playerBody);

  sphereBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3().copy(sphereMesh.position),
    shape: new CANNON.Sphere(sphereRadius),
  });
  world.addBody(sphereBody);

  // Create walls.
  const height = 8;
  const thickness = 4;
  [
    {
      position: [0, 0, -size / 2],
      dimensions: [size, height, thickness],
    },
    {
      position: [0, 0, size / 2],
      dimensions: [size, height, thickness],
    },
    {
      position: [-size / 2, 0, 0],
      dimensions: [thickness, height, size],
    },
    {
      position: [size / 2, 0, 0],
      dimensions: [thickness, height, size],
    },
  ].forEach(box => {
    const mesh = new THREE.Mesh(
      new THREE.BoxBufferGeometry(...box.dimensions),
      new THREE.MeshStandardMaterial({ color: '#333' }),
    );
    mesh.position.fromArray(box.position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const halfExtents = new CANNON.Vec3(...box.dimensions.map(d => d / 2));
    const body = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(...box.position),
      shape: new CANNON.Box(halfExtents),
    });
    world.addBody(body);
  });
}

const update = (() => {
  const dt = 1 / 60;
  let accumulatedTime = 0;

  function updater(object) {
    if (typeof object.update === 'function') {
      object.update(dt, scene);
    }
  }

  return () => {
    const frameTime = Math.min(clock.getDelta(), 0.1);
    accumulatedTime += frameTime;

    while (accumulatedTime >= dt) {
      scene.traverse(updater);
      world.step(dt);
      accumulatedTime -= dt;
    }

    playerObject.position.copy(playerBody.position);
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
  keys[event.code] = true;
});
document.addEventListener('keyup', event => {
  keys[event.code] = false;
});

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
