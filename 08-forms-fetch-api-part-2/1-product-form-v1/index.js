import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  categories = [];
  element = null;
  subElements = {}
  existingProduct = null
  modes = {
    CREATE: 'create',
    EDIT: 'edit'
  }
  images = []

  constructor (productId) {
    this.productId = productId;
    this.mode = this.productId ? this.modes.EDIT : this.modes.CREATE;
  }

  async render () {
    await this.fetchCategories();

    if (this.mode === this.modes.EDIT) {
      await this.fetchProductData();
    }

    this.createElement();
    this.initListeners();

    return this.element;
  }

  async fetchCategories() {
    const url = new URL(`${BACKEND_URL}/api/rest/categories`);
    url.searchParams.set('_sort', 'weight');
    url.searchParams.set('_refs', 'subcategory');

    const data = await fetchJson(url);
    this.categories = data;
  }

  async fetchProductData() {
    const url = new URL(`${BACKEND_URL}/api/rest/products`);
    url.searchParams.set('id', this.productId);

    const data = await fetchJson(url);
    this.existingProduct = data[0];
    this.images = this.existingProduct.images;
  }

  initListeners() {
    this.subElements.productForm.addEventListener('submit', this.onFormSubmit);
  }

  onFormSubmit = (event) => {
    event.preventDefault();

    if (this.mode === this.modes.CREATE) {
      this.createProduct();
    } else {
      this.save();
    }
  }

  async createProduct() {
    const url = new URL(`${BACKEND_URL}/api/rest/products`);

    const data = this.getFormData();

    const responseData = await fetchJson(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      },
    });

    this.element.dispatchEvent(new CustomEvent("product-created"));
  }

  async save() {
    const url = new URL(`${BACKEND_URL}/api/rest/products`);

    const data = this.getFormData();

    const responseData = await fetchJson(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      },
    });

    this.element.dispatchEvent(new CustomEvent("product-updated"));
  }

  getFormData() {
    const formData = new FormData(this.subElements.productForm);

    // Удяляем картинки
    formData.delete('url');
    formData.delete('source');

    const data = Object.fromEntries(formData);
    data.images = this.images;

    return data;
  }

  createElement() {
    const templateHtml = this.createTemplateHtml();
    const wrap = document.createElement("div");
    wrap.innerHTML = templateHtml.trim();
    const element = wrap.firstChild;

    this.element = element;
    this.getSubElements();
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

  createTemplateHtml = () => {
    const { 
      title = '',
      description = '',
      images = [],
      price = 100,
      discount = 0,
      quantity = 1,
      status = 1
    } = this.existingProduct || {};

    return `
    <div class="product-form">
      <form data-element="productForm" class="form-grid">
        <div class="form-group form-group__half_left">
          <fieldset>
            <label class="form-label">Название товара</label>
            <input id="title" required="" type="text" name="title" value="${escapeHtml(title)}" class="form-control" placeholder="Название товара">
          </fieldset>
        </div>
        <div class="form-group form-group__wide">
          <label class="form-label">Описание</label>
          <textarea id="description" required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара">${description}</textarea>
        </div>
        <div class="form-group form-group__wide" data-element="sortable-list-container">
          <label class="form-label">Фото</label>
          <div data-element="imageListContainer">
            <ul class="sortable-list">
              ${images.map(image => this.createImagePlateHtml(image)).join('')}
            </ul>
          </div>
          <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
        </div>
        <div class="form-group form-group__half_left">
          <label class="form-label">Категория</label>
          <select id="subcategory" class="form-control" name="subcategory" id="subcategory">
            ${this.categories.map(category => this.createCategoryOptionsHtml(category)).join('')}
          </select>
        </div>
        <div class="form-group form-group__half_left form-group__two-col">
          <fieldset>
            <label class="form-label">Цена ($)</label>
            <input id="price" required="" type="number" name="price" value="${price}" class="form-control" placeholder="100">
          </fieldset>
          <fieldset>
            <label class="form-label">Скидка ($)</label>
            <input id="discount" required="" type="number" name="discount" value="${discount}" class="form-control" placeholder="0">
          </fieldset>
        </div>
        <div class="form-group form-group__part-half">
          <label class="form-label">Количество</label>
          <input id="quantity" required="" type="number" class="form-control" name="quantity" value="${quantity}" placeholder="1">
        </div>
        <div class="form-group form-group__part-half">
          <label class="form-label">Статус</label>
          <select id="status" class="form-control" name="status">
            <option value="1" ${status === 1 ? 'selected' : ''}>Активен</option>
            <option value="0" ${status === 0 ? 'selected' : ''}>Неактивен</option>
          </select>
        </div>
        <div class="form-buttons">
          <button type="submit" name="save" class="button-primary-outline">
            ${this.mode === this.modes.CREATE ? 'Добавить товар' : 'Сохранить товар'}  
          </button>
        </div>
      </form>
    </div>
    `;
  }

  createCategoryOptionsHtml(category) {
    const subcategories = category.subcategories || [];
    return `
      ${subcategories.map(subcategory => `
        <option value="${subcategory.id}">${category.title} > ${subcategory.title}</option>
      `).join('')}
    `;
  }

  createImagePlateHtml(image) {
    return `
      <li class="products-edit__imagelist-item sortable-list__item" style="">
        <input type="hidden" name="url" value="${escapeHtml(image.url)}">
        <input type="hidden" name="source" value="${escapeHtml(image.source)}">
        <span>
          <img src="icon-grab.svg" data-grab-handle="" alt="grab">
          <img class="sortable-table__cell-img" alt="Image" src="${escapeHtml(image.url)}">
          <span>${escapeHtml(image.source)}</span>
        </span>
        <button type="button">
          <img src="icon-trash.svg" data-delete-handle="" alt="delete">
        </button>
      </li>
    `;
  }

  remove() {
    this.element = null;
    this.subElements = {};
  }

  destroy() {
    this.remove();
  }
}
