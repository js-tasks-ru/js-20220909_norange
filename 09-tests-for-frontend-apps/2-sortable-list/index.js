export default class SortableList {
  wrapper = document.getElementById("holder");
  element = null;
  placeholderElement = null;
  draggedElement = null;
  dragCorrectionX = 0;
  dragCorrectionY = 0;
  itemClass = "sortable-list__item";
  itemClassDragged = "sortable-list__item_dragging";

  constructor({ items = [] }) {
    this.items = items;

    this.render();
    this.initListeners();
  }

  initListeners() {
    document.addEventListener("pointerdown", this.onDragStart);
    document.addEventListener("pointerdown", this.onItemDelete);
    document.addEventListener("dragstart", this.onDefaultDrag);
  }

  removeListeners() {
    document.removeEventListener("pointerdown", this.onDragStart);
    document.removeEventListener("pointermove", this.onDragMove);
    document.removeEventListener("pointerup", this.onDragEnd);
    document.removeEventListener("pointerdown", this.onItemDelete);
    document.removeEventListener("dragstart", this.onDefaultDrag);
  }

  onDefaultDrag = (event) => {
    if (event.target.closest("[data-grab-handle]")) {
      event.preventDefault();
      return false;
    }
  };

  onItemDelete = (event) => {
    const handle = event.target.closest("[data-delete-handle]");
    const item = event.target.closest(`.${this.itemClass}`);
    if (!handle || !item) {
      return;
    }

    const index = this.items.indexOf(item);
    this.items.splice(index, 1);
    item.remove();
  };

  addItem(item) {
    this.items.push(item);
    this.element.append(item);
  }

  onDragStart = (event) => {
    const handle = event.target.closest("[data-grab-handle]");
    const item = event.target.closest(`.${this.itemClass}`);
    if (!handle || !item) {
      return;
    }

    const { left, top } = item.getBoundingClientRect();
    this.dragCorrectionX = event.clientX - left;
    this.dragCorrectionY = event.clientY - top;

    this.draggedElement = item;
    this.placeholderElement = this.createPlaceholder();

    const newLeft = event.clientX - this.dragCorrectionX;
    const newTop = event.clientY - this.dragCorrectionY;
    this.draggedElement.style.top = `${newTop}px`;
    this.draggedElement.style.left = `${newLeft}px`;
    this.draggedElement.style.width = `${this.draggedElement.offsetWidth}px`;

    this.draggedElement.after(this.placeholderElement);
    this.draggedElement.classList.add(this.itemClassDragged);

    document.addEventListener("mousemove", this.onDragMove);
    document.addEventListener("mouseup", this.onDragEnd);
  };

  onDragMove = (event) => {
    const newLeft = event.clientX - this.dragCorrectionX;
    const newTop = event.clientY - this.dragCorrectionY;

    this.draggedElement.style.top = `${newTop}px`;
    this.draggedElement.style.left = `${newLeft}px`;

    const hoveredElement = this.getHoveredElement(event);

    if (hoveredElement) {
      this.swapDomElements(hoveredElement, this.placeholderElement);
    }
  };

  swapDomElements(nodeA, nodeB) {
    const parentA = nodeA.parentNode;
    const siblingA = nodeA.nextSibling === nodeB ? nodeA : nodeA.nextSibling;

    // Move `nodeA` to before the `nodeB`
    nodeB.parentNode.insertBefore(nodeA, nodeB);

    // Move `nodeB` to before the sibling of `nodeA`
    parentA.insertBefore(nodeB, siblingA);
  }

  getHoveredElement(event) {
    const item = Array.prototype.find.call(this.items, (item) => {
      const { top, bottom } = item.getBoundingClientRect();
      return (
        top < event.clientY &&
        bottom > event.clientY &&
        item !== this.draggedElement
      );
    });

    return item;
  }

  onDragEnd = () => {
    this.placeholderElement.replaceWith(this.draggedElement);

    this.draggedElement.classList.remove(this.itemClassDragged);
    this.draggedElement.style.top = "";
    this.draggedElement.style.left = "";
    this.draggedElement.style.width = "";

    document.removeEventListener("mousemove", this.onDragMove);
    document.removeEventListener("mouseup", this.onDragEnd);

    this.reassignItems();
  };

  reassignItems() {
    this.items = Array.from(
      this.element.querySelectorAll(`.${this.itemClass}`)
    );
  }

  createPlaceholder() {
    const width = this.draggedElement.offsetWidth;
    const height = this.draggedElement.offsetHeight;
    const placeholder = document.createElement("div");
    placeholder.classList.add("sortable-list__placeholder");
    placeholder.style.width = `${width}px`;
    placeholder.style.height = `${height}px`;

    return placeholder;
  }

  render() {
    this.element = document.createElement("div");
    this.element.classList.add("sortable-list");

    for (const item of this.items) {
      item.classList.add(this.itemClass);
      this.element.append(item);
    }

    return this.element;
  }

  remove() {
    this.element = null;
    this.removeListeners();
  }

  destroy() {
    this.remove();
  }
}
