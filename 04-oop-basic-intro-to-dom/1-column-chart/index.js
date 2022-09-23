export default class ColumnChart {
  defaultProps = {
    data: [],
    label: "value",
    value: 0,
    link: null,
    formatHeading: (data) => data,
  };

  chartHeight = 50;

  constructor(props) {
    const it = this;

    it.props = {
      ...it.defaultProps,
      ...props,
    };

    it.createElement();
  }

  createLinkHtml() {
    const it = this;

    return it.props.link
      ? `<a href="/${it.props.link}" class="column-chart__link">View all</a>`
      : "";
  }

  createChartHtml() {
    const it = this;

    return `${it.props.data
      .map((value) => it.createChartColumnHtml(value))
      .join("")}`;
  }

  createChartColumnHtml(value) {
    const it = this;

    const maxValue = Math.max(...it.props.data);
    const scale = it.chartHeight / maxValue;
    const height = Math.floor(value * scale);
    const percent = Math.round((value / maxValue) * 100);

    return `
      <div style="--value: ${height}" data-tooltip="${percent}%"></div>
    `;
  }

  createElementHtml() {
    const it = this;

    const heading = it.props.formatHeading(it.props.value);
    const isLoading = !it.props.data.length;
    const classes = ["column-chart"];

    if (isLoading) {
      classes.push("column-chart_loading");
    }

    return `
      <div class="${classes.join(" ")}" 
      style="--chart-height: ${it.chartHeight}">
        <div class="column-chart__title">
          Total ${it.props.label}
          ${it.createLinkHtml()}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">${heading}</div>
          <div data-element="body" class="column-chart__chart">
            ${it.createChartHtml()}
          </div>
        </div>
      </div>
    `;
  }

  createElement() {
    const it = this;

    const templateHtml = it.createElementHtml();

    const wrap = document.createElement("div");
    wrap.innerHTML = templateHtml.trim();
    it.element = wrap.firstChild;
  }

  update(data) {
    const it = this;

    it.props.data = data;

    const chart = it.element.querySelector(".column-chart__chart");

    if (chart) {
      chart.innerHTML = it.createChartHtml();
      it.element.classList.remove("column-chart_loading");

      if (!data.length) {
        it.element.classList.add("column-chart_loading");
      }
    }
  }

  remove() {
    const it = this;

    if (it.element) {
      it.element.remove();
    }
  }

  destroy() {
    const it = this;

    it.remove();
    it.element = null;
  }
}
