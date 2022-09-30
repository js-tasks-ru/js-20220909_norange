// Было мало времени на это задание, по этому не самая красивая реализация на скорую руку
// Пока цель понять, почему не отрабатывают тесты

export default class DoubleSlider {
  currentPercentFrom = 0
  currentPercentTo = 100
  realMin
  realMax
  currentThumb
  subElements = {}
  sliderBounds = {
    left: null,
    right: null,
  }

  constructor({min, max, selected, formatValue = value => '$' + value}) {
    if (!max || !min) {
      throw new Error('Please specify min and max slider values');
    }

    this.min = min;
    this.max = max;
    this.formatValue = formatValue;

    this.createElement();

    if (selected?.from && selected?.to) {
      this.usePresetValues(selected.from, selected.to);
    } else {
      this.updateSlider(this.min, this.max);
    }
  }

  createTemplateHtml() {
    return `
      <div class="range-slider">
        <span data-element="from"></span>
        <div class="range-slider__inner" data-element="innerBounds">
          <span class="range-slider__progress" data-element="progressBar" style="left: 0%; right: 0%"></span>
          <span class="range-slider__thumb-left" data-element="leftSlider" data-side="left" style="left: 0%"></span>
          <span class="range-slider__thumb-right" data-element="rightSlider" data-side="right" style="right: 0%"></span>
        </div>
        <span data-element="to"></span>
      </div>
    `;
  }

  createElement() {
    const templateHtml = this.createTemplateHtml();
    const wrap = document.createElement("div");
    wrap.innerHTML = templateHtml.trim();
    this.element = wrap.firstChild;

    this.getSubElements();
    this.initListeners();
  }

  getSubElements() {
    const elements = this.element.querySelectorAll('[data-element]');

    this.subElements = {};

    for (const element of elements) {
      const name = element.dataset.element;
      this.subElements[name] = element;
    }
  }

  initListeners() {
    this.subElements.leftSlider.addEventListener('pointerdown', this.onDragStart);
    this.subElements.rightSlider.addEventListener('pointerdown', this.onDragStart);
  }

  removeListeners() {
    this.subElements.leftSlider.removeEventListener('pointerdown', this.onDragStart);
    this.subElements.rightSlider.removeEventListener('pointerdown', this.onDragStart);
  }

  onDragStart = (event) => {
    this.currentThumb = event.target;

    this.sliderBounds = {
      left: this.subElements.innerBounds.getBoundingClientRect().left,
      right: this.subElements.innerBounds.getBoundingClientRect().right,
      width: this.subElements.innerBounds.getBoundingClientRect().width,
    };

    document.addEventListener('pointermove', this.onDragMove);
    document.addEventListener('pointerup', this.onDragEnd);
  }

  onDragMove = (event) => {
    const thumbSide = this.currentThumb.dataset.side;

    let cursorMax = this.sliderBounds.right;
    let cursorMin = this.sliderBounds.left;

    if (thumbSide === 'left') {
      cursorMax = this.subElements.rightSlider.getBoundingClientRect().left;
    }

    if (thumbSide === 'right') {
      cursorMin = this.subElements.leftSlider.getBoundingClientRect().right;
    }

    let innerX = event.clientX - this.sliderBounds.left;

    if (event.clientX < cursorMin) {
      innerX = cursorMin - this.sliderBounds.left;
    }

    if (event.clientX > cursorMax) {
      innerX = cursorMax - this.sliderBounds.left;
    }

    const progressPercentFromLeft = innerX / this.sliderBounds.width * 100;
    const currentPercentFromRight = (this.sliderBounds.width - innerX) / this.sliderBounds.width * 100;

    if (thumbSide === 'left') {
      this.currentPercentFrom = progressPercentFromLeft;
    }

    if (thumbSide === 'right') {
      this.currentPercentTo = (100 - currentPercentFromRight);
    }

    this.updateSlider();
  }

  usePresetValues(min, max) {
    this.realMin = min;
    this.realMax = max;

    this.currentPercentFrom = (min - this.min) / this.min * 100;
    this.currentPercentTo = 100 - ((this.max - max) / this.min * 100);
    
    this.updateTextValues();
    this.updateThumbs();
  }

  updateSlider(min, max) {
    this.realMin = min || Math.floor(this.min + this.min * this.currentPercentFrom / 100);
    this.realMax = max || Math.floor(this.max - (100 - this.min * this.currentPercentTo / 100));

    this.updateTextValues();
    this.updateThumbs();
    this.emitChange();
  }

  updateTextValues() {
    this.subElements.from.textContent = this.formatValue(this.realMin);
    this.subElements.to.textContent = this.formatValue(this.realMax);
  }

  updateThumbs() {
    this.subElements.leftSlider.style.left = `${this.currentPercentFrom}%`;
    this.subElements.rightSlider.style.right = `${100 - this.currentPercentTo}%`;

    this.subElements.progressBar.style.left = `${this.currentPercentFrom}%`;
    this.subElements.progressBar.style.right = `${100 - this.currentPercentTo}%`;
  }

  emitChange() {
    this.element.dispatchEvent(new CustomEvent("range-select", {
      detail: { from: this.realMin, to: this.realMax }
    }));
  }

  remove() {
    if (this.element) {
      this.element.remove();
      this.removeListeners();
    }
  }

  destroy() {
    this.remove();
  }

  onDragEnd = () => {
    this.currentThumb = null;
    this.currentSide = null;

    document.removeEventListener('pointermove', this.onDragMove);
    document.removeEventListener('pointerup', this.onDragEnd);
  }
}
