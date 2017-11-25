const { THREE } = window;

export default function pointerLock(controls, element = document.body) {
  const hasPointerLock = 'pointerLockElement' in document;

  const dispatcher = new THREE.EventDispatcher();

  if (!hasPointerLock) {
    // eslint-disable-next-line no-param-reassign
    controls.enabled = true;
    return dispatcher;
  }

  function onPointerLockChange() {
    // eslint-disable-next-line no-param-reassign
    controls.enabled = element === document.pointerLockElement;

    dispatcher.dispatchEvent({
      type: 'change',
      enabled: controls.enabled,
    });
  }

  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('click', () => element.requestPointerLock());

  return dispatcher;
}
