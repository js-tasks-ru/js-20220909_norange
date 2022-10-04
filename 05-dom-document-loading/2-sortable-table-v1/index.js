export default class SortableTable {
  sortField = null;
  sortOrder = null;
  element = null;
  subElements = {}

  constructor(headerConfig = [], data = []) {
    this.headerConfig = headerConfig;
    this.data = [...data];

    this.element = this.createTemplate();
    this.getSubElements();
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

  createTemplate() {
    const templateHtml = this.createTemplateHtml();

    const wrap = document.createElement("div");
    wrap.innerHTML = templateHtml.trim();

    const element = wrap.firstChild;

    return element;
  }

  reRender() {
    const newElement = this.createTemplate();
    this.element.replaceWith(newElement);
    this.element = newElement;
    this.getSubElements();
  }

  sortData() {
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

  sort(fieldId, order) {
    if (!fieldId || !order) {return;}

    this.sortField = fieldId;
    this.sortOrder = order;

    this.sortData();
    this.reRender();
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
