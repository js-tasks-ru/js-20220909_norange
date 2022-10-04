import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
  defaultProps = {
    url: null,
    label: "",
    link: null,
    range: {
      from: null,
      to: null
    },
    formatHeading: (data) => data,
  };

  chartHeight = 50;
  data = []
  value = 0
  subElements = {}

  constructor(props) {
    this.props = {
      ...this.defaultProps,
      ...props,
    };

    this.fetchUrl = `${BACKEND_URL}/${this.props.url}`;

    this.createElement();
    this.fetchData();
  }

  createLinkHtml() {
    return this.props.link
      ? `<a href="/${this.props.link}" class="column-chart__link">View all</a>`
      : "";
  }

  createChartHtml() {
    return `${this.data
      .map((value) => this.createChartColumnHtml(value))
      .join("")}`;
  }

  getFormattedHeading() {
    return this.props.formatHeading(this.value);
  }

  createChartColumnHtml(value) {
    const maxValue = Math.max(...this.data);
    const scale = this.chartHeight / maxValue;
    const height = Math.floor(value * scale);
    const percent = Math.round((value / maxValue) * 100);

    return `
      <div style="--value: ${height}" data-tooltip="${percent}%"></div>
    `;
  }

  createElementHtml() {
    const heading = this.getFormattedHeading();
    const isLoading = !this.data.length;
    const classes = ["column-chart"];

    if (isLoading) {
      classes.push("column-chart_loading");
    }

    return `
      <div class="${classes.join(" ")}" 
      style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.props.label}
          ${this.createLinkHtml()}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">${heading}</div>
          <div data-element="body" class="column-chart__chart">
            ${this.createChartHtml()}
          </div>
        </div>
      </div>
    `;
  }

  createElement() {
    const templateHtml = this.createElementHtml();

    const wrap = document.createElement("div");
    wrap.innerHTML = templateHtml.trim();
    this.element = wrap.firstChild;
    this.getSubElements();
  }

  getSubElements() {
    const elements = this.element.querySelectorAll('[data-element]');

    this.subElements = {};

    for (const element of elements) {
      const name = element.dataset.element;
      this.subElements[name] = element;
    }
  }

  async fetchData() {
    const url = new URL(this.fetchUrl);
    url.searchParams.set('from', this.props.range.from);
    url.searchParams.set('to', this.props.range.to);

    const data = await fetchJson(url);

    this.useServerData(data);
    return data;
  }

  useServerData(data) {
    this.data = [...Object.values(data)];
    this.value = this.data.reduce((prevVal, currentVal) => prevVal + currentVal);

    this.updateTemplate();
  }

  updateTemplate() {
    const chart = this.subElements.body;
    const header = this.subElements.header;

    this.element.classList.remove("column-chart_loading");

    if (!this.data.length) {
      this.element.classList.add("column-chart_loading");
    }

    chart.innerHTML = this.createChartHtml();
    header.textContent = this.getFormattedHeading();
  }

  update(dateStart, dateEnd) {
    if (!dateStart || !dateEnd) {
      throw new Error('Please provide start and end dates');
    }

    this.props.range = {
      from: dateStart,
      to: dateEnd
    };

    return this.fetchData();
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
  }
}
