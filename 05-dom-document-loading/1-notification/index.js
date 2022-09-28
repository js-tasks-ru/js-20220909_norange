export default class NotificationMessage {
  static activeNotification;
  timeout = null;

  constructor(message = "", { duration = 2000, type = "success" } = {}) {
    this.message = message;
    this.duration = duration;
    this.type = type;

    this.createElement();
  }

  createMessageHtml() {
    return `
    <div class="notification ${this.type}" style="--value:${this.duration / 1000}s">
      <div class="timer"></div>
      <div class="inner-wrapper">
        <div class="notification-header">success</div>
        <div class="notification-body">
          ${this.message}
        </div>
      </div>
    </div>
    `;
  }

  createElement() {
    const templateHtml = this.createMessageHtml();
    const wrap = document.createElement("div");
    wrap.innerHTML = templateHtml.trim();
    this.element = wrap.firstChild;
  }

  show(parent = document.body) {
    if (NotificationMessage.activeNotification) {
      NotificationMessage.activeNotification.remove();
    }

    parent.append(this.element);
    this.startTimer();

    NotificationMessage.activeNotification = this;
  }

  triggerShowEvent() {
    const event = new CustomEvent("notification-show", { bubbles: true });
    this.element.dispatchEvent(event);
  }

  clearTimer() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  startTimer() {
    this.clearTimer();

    this.timeout = setTimeout(() => {
      this.remove();
    }, this.duration);
  }

  remove() {
    this.clearTimer();

    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
  }
}
