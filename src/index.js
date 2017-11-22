/* global THREE */

let container;

let scene;
let camera;
let renderer;

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
  );
  camera.position.set(0, 0, 8);

  scene.add(new THREE.AmbientLight('#777'));

  const light = new THREE.DirectionalLight();
  light.position.set(8, 8, 8);
  scene.add(light);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

function render() {
  renderer.render(scene, camera);
}

init();
render();

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.addEventListener('change', render);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
});
