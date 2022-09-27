export default class NotificationMessage {
  timeout = null;
  eventListeners = {};

  constructor(message = "", { duration = 2000, type = "success" } = {}) {
    this.message = message;
    this.duration = duration;
    this.type = type;

    this.createElement();
    this.initEventListeners();
  }

  createMessageHtml() {
    return `
    <div class="notification ${this.type}" style="--value:${
      this.duration / 1000
    }s">
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

  initEventListeners() {
    this.eventListeners = {
      onNotificationShow: this.onNotificationShow.bind(this),
    };

    document.body.addEventListener(
      "notification-show",
      this.eventListeners.onNotificationShow
    );
  }

  removeEventListeners() {
    document.body.removeEventListener(
      "notification-show",
      this.eventListeners.onNotificationShow
    );

    this.eventListeners = {};
  }

  onNotificationShow(event) {
    if (event.target !== this.element) {
      this.destroy();
    }
  }

  createElement() {
    const templateHtml = this.createMessageHtml();
    const wrap = document.createElement("div");
    wrap.innerHTML = templateHtml.trim();
    this.element = wrap.firstChild;
  }

  show(element) {
    const parent = element || document.querySelector("body");

    this.clearTimer();
    this.remove();

    parent.append(this.element);

    this.triggerShowEvent();
    this.startTimer();
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
    this.removeEventListeners();
    this.element = null;
  }
}
