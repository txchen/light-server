import triggerAlert from './alert'

window.addEventListener('load', () => {
  const alertButton = document.querySelector('.alert-button');

  alertButton.addEventListener('click', () => triggerAlert());
});
