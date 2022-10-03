import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  sortField = null;
  sortOrder = null;
  element = null;
  subElements = {}
  data = []
  isLoading = true
  startIndex = 0
  endIndex = 30
  itemsPerUpload = 30
  noMoreDataToLoad = false

  constructor(headerConfig = [], { url = null, isSortLocally = false, sorted = {} }) {
    this.headerConfig = headerConfig;

    if (sorted.id && sorted.order) {
      this.sortField = sorted.id;
      this.sortOrder = sorted.order;
    }

    this.fetchUrl = `${BACKEND_URL}/${url}`;
    this.isSortLocally = isSortLocally;

    this.createElement();
    this.render();
    this.initScrollListeners();
  }

  initScrollListeners() {
    window.addEventListener('scroll', this.onPageScroll);
  }

  removeScrollListeners() {
    window.removeEventListener('scroll', this.onPageScroll);
  }

  initElementListeners() {
    this.subElements.header.addEventListener('pointerdown', this.onHeaderClick);
  }

  removeElementListeners() {
    this.subElements.header.removeEventListener('pointerdown', this.onHeaderClick);
  }

  onPageScroll = () => {
    if (this.isLoading || !this.data.length) {return;}

    const windowBot = window.innerHeight + document.body.scrollTop;
    const tableBot = this.subElements.body.getBoundingClientRect().bottom;

    if (windowBot >= tableBot) {
      this.loadExtraData();
    }
  }

  onHeaderClick = (event) => {
    const cell = event.target.closest('.sortable-table__cell');

    if (!cell || cell.dataset.sortable === 'false') {
      return;
    }

    const id = cell.dataset.id;
    const order = cell.dataset.order;
    const newOrder = order === 'desc' ? 'asc' : 'desc';

    this.sort(id, newOrder);
  }

  createHeaderCellHtml(item) {
    const isSortedBy = item.id === this.sortField;
    const order = isSortedBy ? this.sortOrder : "";

    return `
      <div class="sortable-table__cell" data-id="${item.id}" data-sortable="${item.sortable}" data-order="${order}">
        <span>${item.title}</span>
        <span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>
      </div>
    `;
  }

  createHeaderHtml() {
    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.headerConfig
          .map((item) => this.createHeaderCellHtml(item))
          .join("")}
      </div>
    `;
  }

  createTableRowHtml(item) {
    return `
      <a href="/products/${item.id}" class="sortable-table__row">
        ${this.headerConfig
          .map((field) => {
            return this.createTableCellHtml(item, field);
          })
          .join("")}
      </a>
    `;
  }

  createTableCellHtml(item, field) {
    const fieldId = field.id;

    return field.template ? 
      field.template(item[fieldId]) : 
      `<div class="sortable-table__cell">${item[fieldId]}</div>`;
  }

  createTableHtml() {
    return `
      <div data-element="body" class="sortable-table__body">
        ${this.data.map((item) => this.createTableRowHtml(item)).join("")}
      </div>
    `;
  }

  createLoaderHtml() {
    return `<div data-element="loading" class="loading-line sortable-table__loading-line"></div>`;
  }

  createDataPlaceholderHtml() {
    return `
      <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
        <div>
          <p>No products satisfies your filter criteria</p>
          <button type="button" class="button-primary-outline">Reset all filters</button>
        </div>
      </div>`;
  }

  createTemplateHtml() {
    const tableClasses = [];

    if (this.isLoading) {tableClasses.push('sortable-table_loading');}
    if (!this.data.length && !this.isLoading) {tableClasses.push('sortable-table_empty');}

    return `
      <div data-element="productsContainer" class="products-list__container">
        <div class="sortable-table ${tableClasses.join(' ')}">
          ${this.createHeaderHtml()}
          ${this.createTableHtml()}
          ${this.createLoaderHtml()}
          ${this.createDataPlaceholderHtml()}
        </div>
      </div>
    `;
  }

  getSubElements() {
    if (!this.element) {
      this.subElements = {};
      return;
    }

    const elements = this.element.querySelectorAll('[data-element]');

    for (const element of elements) {
      const name = element.dataset.element;
      this.subElements[name] = element;
    }
  }

  createElement() {
    const templateHtml = this.createTemplateHtml();

    const wrap = document.createElement("div");
    wrap.innerHTML = templateHtml.trim();
    const element = wrap.firstChild;

    if (this.element) {
      this.removeElementListeners();
      this.element.replaceWith(element);
    }

    this.element = element;
    this.getSubElements();
    this.initElementListeners();
  }

  async render() {
    this.startIndex = 0;
    this.endIndex = this.startIndex + this.itemsPerUpload;
    this.noMoreDataToLoad = false;

    const data = await this.loadData();

    this.data = data;
    this.createElement();
  }

  async loadExtraData() {
    if (this.noMoreDataToLoad) {return;}

    if (this.isSortLocally) {
      // ...not sure about this logic, added question in discord
    }

    this.startIndex += this.itemsPerUpload;
    this.endIndex += this.itemsPerUpload;

    const data = await this.loadData();

    if (!data || !data.length) {
      this.noMoreDataToLoad = true;
      return;
    }

    this.data = this.data.concat(data);
    this.renderExtraItems(data);
    
  }

  async loadData() {
    const url = new URL(this.fetchUrl);
    const applySort = this.sortField && this.sortOrder;

    url.searchParams.set('_start', this.startIndex);
    url.searchParams.set('_end', this.endIndex);
    if (applySort) {
      url.searchParams.set('_sort', this.sortField);
      url.searchParams.set('_order', this.sortOrder);
    }

    this.isLoading = true;
    const data = await fetchJson(url);
    this.isLoading = false;

    return data;
  }

  renderExtraItems(data) {
    const html = data.map(item => this.createTableRowHtml(item)).join('');
    this.subElements.body.insertAdjacentHTML('beforeend', html);
  }

  sortOnClient(fieldId, order) {
    this.sortField = fieldId;
    this.sortOrder = order;

    const sortType = this.headerConfig.find(
      (item) => item.id === this.sortField
    ).sortType;

    if (sortType === 'number') {
      return this.sortDataByNumericTypeField();
    }
    
    if (sortType === 'string') {
      return this.sortDataByStringTypeField();
    }
  }

  sortDataByNumericTypeField() {
    this.data.sort((a, b) => {
      const modifier = this.sortOrder === "asc" ? 1 : -1;
      return modifier * (a[this.sortField] - b[this.sortField]);
    });
  }

  sortDataByStringTypeField() {
    this.data.sort((a, b) => {
      const modifier = this.sortOrder === "asc" ? 1 : -1;
      return (
        modifier * this.compareStrings(a[this.sortField], b[this.sortField])
      );
    });
  }

  sortOnServer(fieldId, order) {
    this.sortField = fieldId;
    this.sortOrder = order;

    this.render();
  }

  sort(fieldId, order) {
    if (!fieldId || !order) {return;}

    if (this.isSortLocally) {
      this.sortOnClient(fieldId, order);
    } else {
      this.sortOnServer(fieldId, order);
    }

    this.createElement();
  }

  compareStrings = (string1, string2) => {
    return string1.localeCompare(string2, ["ru", "en"], {
      sensitivity: "variant",
      caseFirst: "upper",
    });
  };

  remove() {
    if (this.element) {
      this.element.remove();
      this.removeElementListeners();
      this.removeScrollListeners();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}