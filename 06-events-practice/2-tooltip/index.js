class Tooltip {
  static instance

  instance = null
  activeEl = null
  element = null
  text = ''

  constructor() {
    if (Tooltip.instance) {
      return Tooltip.instance;
    }

    Tooltip.instance = this;
  }

  initialize () {
    this.initListeners();
  }

  initListeners() {
    document.addEventListener('pointerover', this.onPointerOver);
  }

  onPointerOver = (event) => {
    if (event.defaultPrevented) {
      return;
    }

    const element = event.target.closest('[data-tooltip]');
    const text = element?.dataset.tooltip;

    if (element && text) {
      event.preventDefault();
      this.activeEl = element;
      this.text = text;
      this.attachTooltip();
    }
  }

  onPointerOut = () => {
    this.remove();
  }

  onMouseMove = (event) => {
    const shift = 10;
    this.element.style.left = `${event.clientX + shift}px`;
    this.element.style.top = `${event.clientY + shift}px`;
  }

  attachTooltip() {
    this.render();

    this.activeEl.addEventListener('pointerout', this.onPointerOut);
    document.addEventListener('pointermove', this.onMouseMove);
  }

  render() {
    const element = document.createElement('div');
    element.classList.add('tooltip');
    element.textContent = this.text;
    this.element = element;
    document.body.append(this.element);
  }

  remove() {
    document.removeEventListener('pointermove', this.onMouseMove);

    if (this.activeEl) {
      this.activeEl.removeEventListener('pointerout', this.onPointerOut);
      this.activeEl = null;
    }
    
    if (this.element) {
      this.element.remove();
      this.element = null;
    }

    this.text = '';
  }

  destroy() {
    this.remove();
    document.removeEventListener('pointerover', this.onPointerOver);
  }
}

export default Tooltip;
