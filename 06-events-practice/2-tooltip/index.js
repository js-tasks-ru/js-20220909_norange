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
    this.destroyTooltip();
  }

  destroyTooltip() {
    document.removeEventListener('mousemove', this.onMouseMove);

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

  onMouseMove = (event) => {
    this.element.style.left = `${event.clientX + 10}px`;
    this.element.style.top = `${event.clientY + 10}px`;
  }

  attachTooltip() {
    this.render();

    this.activeEl.addEventListener('pointerout', this.onPointerOut);
    document.addEventListener('mousemove', this.onMouseMove);
  }

  render() {
    const element = document.createElement('div');
    element.classList.add('tooltip');
    element.textContent = this.text;
    this.element = element;
    document.body.append(this.element);
  }

  destroy() {
    this.destroyTooltip();
    document.removeEventListener('pointerover', this.onPointerOver);
  }
}

export default Tooltip;
