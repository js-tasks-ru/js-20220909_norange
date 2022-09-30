export default class SortableTable {
  sortField = null;
  sortOrder = null;
  element = null;
  subElements = {}
  isSortLocally = true

  constructor(headerConfig = [], { data = [], sorted = null }) {
    this.headerConfig = headerConfig;
    this.data = [...data];

    if (sorted.id && sorted.order) {
      this.sort(sorted.id, sorted.order);
    } else {
      this.createElement();
    }
  }

  initListeners() {
    this.subElements.header.addEventListener('pointerdown', this.onHeaderClick);
  }

  removeListeners() {
    this.subElements.header.removeEventListener('pointerdown', this.onHeaderClick);
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

  createTemplateHtml() {
    return `
      <div data-element="productsContainer" class="products-list__container">
        <div class="sortable-table">
          ${this.createHeaderHtml()}
          ${this.createTableHtml()}
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
      this.removeListeners();
      this.element.replaceWith(element);
    }

    this.element = element;
    this.getSubElements();
    this.initListeners();
  }

  sortOnClient() {
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

  sortOnServer() {
    // to be done
  }

  sort(fieldId, order) {
    if (!fieldId || !order) {return;}

    this.sortField = fieldId;
    this.sortOrder = order;

    if (this.isSortLocally) {
      this.sortOnClient();
    } else {
      this.sortOnServer();
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
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}
