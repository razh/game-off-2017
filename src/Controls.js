const { THREE } = window;

const direction = new THREE.Vector3(0, 0, -1);
const rotation = new THREE.Euler(0, 0, 0, 'YXZ');

// Custom THREE.PointerLockControls.
export default class Controls {
  constructor(camera) {
    this.camera = camera;
    camera.rotation.set(0, 0, 0);

    this.sensitivity = 0.002;
    this.enabled = false;

    this.pitchObject = new THREE.Object3D();
    this.pitchObject.add(camera);

    this.yawObject = new THREE.Object3D();
    this.yawObject.add(this.pitchObject);

    this.onMouseMove = this.onMouseMove.bind(this);
    document.addEventListener('mousemove', this.onMouseMove);
  }

  onMouseMove(event) {
    if (!this.enabled) {
      return;
    }

    const { movementX, movementY } = event;

    this.yawObject.rotation.y -= movementX * this.sensitivity;
    this.pitchObject.rotation.x -= movementY * this.sensitivity;

    this.pitchObject.rotation.x = THREE.Math.clamp(
      this.pitchObject.rotation.x,
      -Math.PI / 2,
      Math.PI / 2,
    );
  }

  getObject() {
    return this.yawObject;
  }

  getDirection(vector = new THREE.Vector3()) {
    this.getEuler(rotation);
    vector.copy(direction).applyEuler(rotation);
    return vector;
  }

  getEuler(euler = new THREE.Euler()) {
    return euler.set(this.pitchObject.rotation.x, this.yawObject.rotation.y, 0);
  }

  getQuaternion(quaternion = new THREE.Quaternion()) {
    this.getEuler(rotation);
    quaternion.setFromEuler(rotation);
    return quaternion;
  }
}
