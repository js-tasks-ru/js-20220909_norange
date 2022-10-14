import RangePicker from "./components/range-picker/src/index.js";
import SortableTable from "./components/sortable-table/src/index.js";
import ColumnChart from "./components/column-chart/src/index.js";
import header from "./bestsellers-header.js";

import fetchJson from "./utils/fetch-json.js";

const BACKEND_URL = "https://course-js.javascript.ru/";

export default class Page {
  dateRange = {
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  };

  ordersChart = new ColumnChart({
    label: "Заказы",
    link: "#",
    url: "api/dashboard/orders",
    range: this.dateRange,
  });
  salesChart = new ColumnChart({
    label: "Продажи",
    url: "api/dashboard/sales",
    range: this.dateRange,
  });
  customersChart = new ColumnChart({
    label: "Клиенты ",
    url: "api/dashboard/customers",
    range: this.dateRange,
  });

  rangePicker = new RangePicker({
    ...this.dateRange,
  });

  productsTable = new SortableTable(header, {
    url: "api/dashboard/bestsellers",
    isSortLocally: true,
    range: this.dateRange,
  });

  element = null;
  subElements = {};

  constructor() {
    this.initListeners();
  }

  initListeners() {
    document.addEventListener("date-select", this.onDateSelect);
  }

  removeListeners() {
    document.removeEventListener("date-select", this.onDateSelect);
  }

  onDateSelect = (event) => {
    const { from, to } = event.detail;

    this.ordersChart.loadData(from, to);
    this.salesChart.loadData(from, to);
    this.customersChart.loadData(from, to);
    this.productsTable.setDates(from, to);

    this.dateRange = {
      from: new Date(event.detail.from),
      to: new Date(event.detail.to),
    };
  };

  render() {
    const templateHtml = this.createTemplateHtml();
    const wrap = document.createElement("div");
    wrap.innerHTML = templateHtml.trim();
    const element = wrap.firstChild;

    this.element = element;
    this.getSubElements();
    this.renderComponents();

    return this.element;
  }

  createTemplateHtml() {
    return `
    <div class="dashboard">
      <div class="content__top-panel">
        <h2 class="page-title">Панель управления</h2>
        <div data-element="rangePicker"></div>
      </div>
      <div data-element="chartsRoot" class="dashboard__charts">
        <div data-element="ordersChart" class="dashboard__chart_orders"></div>
        <div data-element="salesChart" class="dashboard__chart_sales"></div>
        <div data-element="customersChart" class="dashboard__chart_customers"></div>
      </div>

      <h3 class="block-title">Лидеры продаж</h3>

      <div data-element="sortableTable">
        
      </div>
    </div>
    `;
  }

  renderComponents() {
    this.subElements.rangePicker.replaceWith(this.rangePicker.element);
    this.subElements.rangePicker = this.rangePicker.element;

    this.subElements.ordersChart.replaceWith(this.ordersChart.element);
    this.subElements.ordersChart = this.ordersChart.element;
    this.subElements.ordersChart.classList.add("dashboard__chart_orders");

    this.subElements.salesChart.replaceWith(this.salesChart.element);
    this.subElements.salesChart = this.salesChart.element;
    this.subElements.salesChart.classList.add("dashboard__chart_sales");

    this.subElements.customersChart.replaceWith(this.customersChart.element);
    this.subElements.customersChart = this.customersChart.element;
    this.subElements.customersChart.classList.add("dashboard__chart_customers");

    this.subElements.sortableTable.replaceWith(this.productsTable.element);
    this.subElements.sortableTable = this.productsTable.element;
  }

  getSubElements() {
    if (!this.element) {
      this.subElements = {};
      return;
    }

    const elements = this.element.querySelectorAll("[data-element]");

    for (const element of elements) {
      const name = element.dataset.element;
      this.subElements[name] = element;
    }
  }

  remove() {
    this.element && this.element.remove();
    this.element = null;
    this.subElements = {};
    this.removeListeners();
  }

  destroy() {
    this.remove();
    this.ordersChart.destroy();
    this.salesChart.destroy();
    this.customersChart.destroy();
    this.rangePicker.destroy();
    this.productsTable.destroy();
  }
}
