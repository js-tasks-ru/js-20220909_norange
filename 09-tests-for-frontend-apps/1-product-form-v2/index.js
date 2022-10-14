import SortableList from "../2-sortable-list/index.js";
import escapeHtml from "./utils/escape-html.js";
import fetchJson from "./utils/fetch-json.js";

const IMGUR_CLIENT_ID = "28aaa2e823b03b1";
const BACKEND_URL = "https://course-js.javascript.ru";

export default class ProductForm {
  categories = [];
  element = null;
  subElements = {};
  modes = {
    CREATE: "create",
    EDIT: "edit",
  };
  images = [];
  product = {
    title: "",
    description: "",
    images: [],
    price: 100,
    discount: 0,
    quantity: 1,
    status: 1,
  };
  sortableList = null;

  constructor(productId) {
    this.productId = productId;
    this.mode = this.productId ? this.modes.EDIT : this.modes.CREATE;
  }

  async render() {
    await Promise.all([this.fetchCategories(), this.fetchProductData()]);

    this.createElement();
    this.initListeners();

    return this.element;
  }

  async fetchCategories() {
    const url = new URL(`${BACKEND_URL}/api/rest/categories`);
    url.searchParams.set("_sort", "weight");
    url.searchParams.set("_refs", "subcategory");

    const data = await fetchJson(url);
    this.categories = data;
    return this.categories;
  }

  async fetchProductData() {
    if (this.mode === this.modes.CREATE) {
      return Promise.resolve();
    }

    const url = new URL(`${BACKEND_URL}/api/rest/products`);
    url.searchParams.set("id", this.productId);

    const data = await fetchJson(url);
    this.product = data[0];
    return this.product;
  }

  initListeners() {
    this.subElements.productForm.addEventListener("submit", this.onFormSubmit);
    this.subElements.imageUploadButton.addEventListener(
      "click",
      this.onUploadImageClick
    );
    this.subElements.imageUploadInput.addEventListener(
      "change",
      this.onImageUpload
    );
  }

  onUploadImageClick = () => {
    this.subElements.imageUploadInput.click();
  };

  onImageUpload = async (event) => {
    this.subElements.imageUploadButton.classList.add("is-loading");
    const file = event.target.files[0];

    const result = await this.uploadImage(file);
    const url = result.data.link;
    const source = file.name;
    this.addImage({ url: url, source: source });
    this.subElements.imageUploadButton.classList.remove("is-loading");
  };

  async uploadImage(file) {
    const formData = new FormData();

    formData.append("image", file);

    try {
      const response = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        },
        body: formData,
        referrer: "",
      });

      return await response.json();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  addImage(image) {
    const html = this.createImagePlateHtml(image);
    this.sortableList.addItem(html);
  }

  onFormSubmit = (event) => {
    event.preventDefault();

    this.save();
  };

  async save() {
    const url = new URL(`${BACKEND_URL}/api/rest/products`);
    const data = this.getFormData();

    let method;
    let successEvent;

    if (this.mode === this.modes.CREATE) {
      method = "PUT";
      successEvent = "product-created";
    } else {
      method = "PATCH";
      successEvent = "product-updated";
    }

    await fetchJson(url, {
      method: method,
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.element.dispatchEvent(new CustomEvent(successEvent));
  }

  getFormData() {
    const formData = new FormData(this.subElements.productForm);

    // Удяляем картинки
    formData.delete("url");
    formData.delete("source");

    const data = Object.fromEntries(formData);
    const images = this.sortableList.items.map((item) => {
      return {
        url: item.querySelector('input[name="url"]').value,
        source: item.querySelector('input[name="source"]').value,
      };
    });

    data.images = images;

    return data;
  }

  createElement() {
    const templateHtml = this.createTemplateHtml();
    const wrap = document.createElement("div");
    wrap.innerHTML = templateHtml.trim();
    const element = wrap.firstChild;

    this.element = element;
    this.getSubElements();
    this.renderImageList();
  }

  renderImageList() {
    const items = this.product.images.map((image) => {
      return this.createImagePlateHtml(image);
    });
    this.sortableList = new SortableList({ items });
    this.subElements.imageListContainer.append(this.sortableList.element);
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

  createTemplateHtml = () => {
    const {
      title = "",
      description = "",
      images = [],
      price = 100,
      discount = 0,
      quantity = 1,
      status = 1,
    } = this.product;

    return `
    <div class="product-form">
      <form data-element="productForm" class="form-grid">
        <div class="form-group form-group__half_left">
          <fieldset>
            <label class="form-label">Название товара</label>
            <input id="title" required="" type="text" name="title" 
            value="${escapeHtml(
              title
            )}" class="form-control" placeholder="Название товара">
          </fieldset>
        </div>
        <div class="form-group form-group__wide">
          <label class="form-label">Описание</label>
          <textarea id="description" required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара">${description}</textarea>
        </div>
        <div class="form-group form-group__wide" data-element="sortable-list-container">
          <label class="form-label">Фото</label>
          <div data-element="imageListContainer">
            
          </div>
          <button type="button" name="uploadImage" data-element="imageUploadButton" class="button-primary-outline"><span>Загрузить</span></button>
          <input type="file" accept="image/*" data-element="imageUploadInput" hidden>
        </div>
        <div class="form-group form-group__half_left">
          <label class="form-label">Категория</label>
          <select id="subcategory" class="form-control" name="subcategory" id="subcategory">
            ${this.categories
              .map((category) => this.createCategoryOptionsHtml(category))
              .join("")}
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
            <option value="1" ${status === 1 ? "selected" : ""}>Активен</option>
            <option value="0" ${
              status === 0 ? "selected" : ""
            }>Неактивен</option>
          </select>
        </div>
        <div class="form-buttons">
          <button type="submit" name="save" class="button-primary-outline">
            ${
              this.mode === this.modes.CREATE
                ? "Добавить товар"
                : "Сохранить товар"
            }  
          </button>
        </div>
      </form>
    </div>
    `;
  };

  createCategoryOptionsHtml(category) {
    const subcategories = category.subcategories || [];
    return `
      ${subcategories
        .map(
          (subcategory) => `
            <option value="${subcategory.id}">${category.title} > ${subcategory.title}</option>
          `
        )
        .join("")}
    `;
  }

  createImagePlateHtml(image) {
    const wrap = document.createElement("div");
    const itemHtml = `
      <li class="products-edit__imagelist-item sortable-list__item" style="">
        <input type="hidden" name="url" value="${escapeHtml(image.url)}">
        <input type="hidden" name="source" value="${escapeHtml(image.source)}">
        <span>
          <img src="icon-grab.svg" data-grab-handle="" alt="grab">
          <img class="sortable-table__cell-img" alt="Image" src="${escapeHtml(
            image.url
          )}">
          <span>${escapeHtml(image.source)}</span>
        </span>
        <button type="button">
          <img src="icon-trash.svg" data-delete-handle="" alt="delete">
        </button>
      </li>
    `;
    wrap.innerHTML = itemHtml.trim();
    return wrap.firstChild;
  }

  remove() {
    this.element = null;
    this.subElements = {};
  }

  destroy() {
    this.remove();
  }
}
