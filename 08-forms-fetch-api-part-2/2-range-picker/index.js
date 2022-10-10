export default class RangePicker {
  firstCalendar = {
    month: null,
    year: null,
  };
  secondCalendar = {
    month: null,
    year: null,
  };
  isOpened = false;
  startDate = null;
  endDate = null;
  element = null;
  subElements = {};
  calendarsAreRendered = false;

  constructor({ from, to }) {
    this.setInitialData(from, to);
    this.createElement();
    this.initListeners();
    this.setDateRange(this.startDate, this.endDate, true);
  }

  setInitialData(from, to) {
    if (from && to) {
      this.startDate = new Date(from);
      this.endDate = new Date(to);

      this.firstCalendar.month = this.startDate.getMonth();
      this.firstCalendar.year = this.startDate.getFullYear();

      this.secondCalendar.month = this.endDate.getMonth();
      this.secondCalendar.year = this.endDate.getFullYear();
    } else {
      this.setDefaultData();
    }
  }

  // Выбрать диапазон начиная с аналогичной даты прошлого месяца
  setDefaultData() {
    const currentDate = new Date();

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = prevMonth === 11 ? currentYear - 1 : currentYear;

    this.firstCalendar.month = prevMonth;
    this.firstCalendar.year = prevYear;

    this.secondCalendar.month = currentMonth;
    this.secondCalendar.year = currentYear;

    this.endDate = new Date();
    const sameDatePrevMonth = new Date(
      new Date().setMonth(this.endDate.getMonth() - 1)
    );
    this.startDate = sameDatePrevMonth;
  }

  setDateRange(date1, date2, silent = false) {
    if (!date1 || !date2) return;

    if (date1 > date2) {
      this.startDate = date2;
      this.endDate = date1;
    } else {
      this.startDate = date1;
      this.endDate = date2;
    }

    this.subElements.from.textContent = this.startDate.toLocaleDateString();
    this.subElements.to.textContent = this.endDate.toLocaleDateString();

    this.setDaysClasses();
    this.closeCalendar();

    if (!silent) {
      this.element.dispatchEvent(
        new CustomEvent("date-select", {
          detail: { from: this.startDate, to: this.endDate },
        })
      );
    }
  }

  setDaysClasses() {
    this.clearDaysClasses();

    const days =
      this.subElements.selector.querySelectorAll(".rangepicker__cell");

    days.forEach((day) => {
      const date = new Date(day.dataset.value);

      const isStart = date.toDateString() === this.startDate?.toDateString();
      const isEnd = date.toDateString() === this.endDate?.toDateString();
      const isInBetween = date > this.startDate && date < this.endDate;

      if (isStart) {
        day.classList.add("rangepicker__selected-from");
      } else if (isEnd) {
        day.classList.add("rangepicker__selected-to");
      } else if (isInBetween) {
        day.classList.add("rangepicker__selected-between");
      }
    });
  }

  clearDaysClasses() {
    const days =
      this.subElements.selector.querySelectorAll(".rangepicker__cell");

    days.forEach((day) => {
      day.classList.remove(
        "rangepicker__selected-from",
        "rangepicker__selected-to",
        "rangepicker__selected-between"
      );
    });
  }

  initListeners() {
    this.subElements.selector.addEventListener(
      "click",
      this.switchMonths.bind(this)
    );
    this.subElements.selector.addEventListener(
      "click",
      this.selectDate.bind(this)
    );
    this.subElements.input.addEventListener(
      "click",
      this.toggleCalendar.bind(this)
    );
  }

  removeListeners() {
    document.removeEventListener("click", this.checkClickOutside, true);
  }

  checkClickOutside = (event) => {
    if (
      !this.subElements.selector.contains(event.target) &&
      !this.subElements.input.contains(event.target)
    ) {
      this.closeCalendar();
    }
  };

  selectDate(event) {
    const cell = event.target.closest(".rangepicker__cell");

    if (!cell) return;

    const date = new Date(cell.dataset.value);

    if (this.startDate && this.endDate) {
      this.clearDaysClasses();
      this.startDate = date;
      this.endDate = null;
      cell.classList.add("rangepicker__selected-from");
    } else if (this.startDate && !this.endDate) {
      this.endDate = date;
      this.setDateRange(this.startDate, this.endDate);
    }

    document.activeElement.blur();
  }

  toggleCalendar() {
    if (this.isOpened) {
      this.closeCalendar();
    } else {
      this.openCalendar();
    }
  }

  closeCalendar() {
    this.isOpened = false;
    this.element.classList.remove("rangepicker_open");
  }

  openCalendar() {
    if (!this.calendarsAreRendered) {
      this.renderCalendar();
    }
    this.isOpened = true;
    this.element.classList.add("rangepicker_open");
  }

  switchMonths(event) {
    const element = event.target.closest("[data-switch]");

    if (!element) return;

    const switchTo = element.dataset.switch;

    if (switchTo === "prev") {
      this.switchCalendarToPrev();
    } else {
      this.switchCalendarToNext();
    }
  }

  switchCalendarToPrev() {
    this.secondCalendar = { ...this.firstCalendar };

    const newFirstMonth =
      this.firstCalendar.month === 0 ? 11 : this.firstCalendar.month - 1;
    const newFirstYear =
      this.firstCalendar.month === 0
        ? this.firstCalendar.year - 1
        : this.firstCalendar.year;

    this.firstCalendar = {
      month: newFirstMonth,
      year: newFirstYear,
    };

    this.renderCalendar();
  }

  switchCalendarToNext() {
    this.firstCalendar = { ...this.secondCalendar };

    const newSecondMonth =
      this.secondCalendar.month === 11 ? 0 : this.secondCalendar.month + 1;
    const newSecondYear =
      this.secondCalendar.month === 11
        ? this.secondCalendar.year + 1
        : this.secondCalendar.year;

    this.secondCalendar = {
      month: newSecondMonth,
      year: newSecondYear,
    };

    this.renderCalendar();
  }

  createElement() {
    const wrap = document.createElement("div");
    const html = this.createTemplateHtml();
    wrap.innerHTML = html.trim();

    this.element = wrap.firstElementChild;
    this.getSubElements();
  }

  renderCalendar() {
    this.removeCalendar();
    const firstTab = this.createMonthHtml(this.firstCalendar);
    const secondTab = this.createMonthHtml(this.secondCalendar);

    this.subElements.selector.insertAdjacentHTML(
      "beforeend",
      `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left" data-switch="prev"></div>
      <div class="rangepicker__selector-control-right" data-switch="next"></div>
      ${firstTab}${secondTab}
      `
    );

    this.calendarsAreRendered = true;
    this.setDaysClasses();
  }

  removeCalendar() {
    const calendars = Array.from(
      this.element.querySelectorAll(".rangepicker__calendar")
    );
    if (calendars.length) {
      calendars.forEach((element) => {
        element.remove();
      });
    }
  }

  createMonthHtml({ month, year }) {
    const date = new Date(Date.UTC(year, month, 1));

    const formattedMonth = date.toLocaleString("ru-RU", { month: "long" });
    const days = [];

    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }

    return `
    <div class="rangepicker__calendar">
      <div class="rangepicker__month-indicator">
        <time datetime="${formattedMonth}">${formattedMonth}</time>
      </div>
      <div class="rangepicker__day-of-week">
        <div>Пн</div>
        <div>Вт</div>
        <div>Ср</div>
        <div>Чт</div>
        <div>Пт</div>
        <div>Сб</div>
        <div>Вс</div>
      </div>
      <div class="rangepicker__date-grid">
        ${days.map((day) => this.createDateCell(day)).join("")}
      </div>
    </div>
    `;
  }

  createDateCell(date) {
    const day = date.getDate();
    let styles = "";

    if (day === 1) {
      styles = `style="--start-from: ${date.getDay()}"`;
    }

    return `
      <button type="button" class="rangepicker__cell" data-value="${date.toDateString()}" ${styles}>${day}</button>
    `;
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

  createTemplateHtml() {
    return `
    <div class="rangepicker">
      <div class="rangepicker__input" data-element="input">
        <span data-element="from">Нет даты</span> -
        <span data-element="to">Нет даты</span>
      </div>
      <div class="rangepicker__selector" data-element="selector"></div>
    </div>
    `;
  }

  remove() {
    this.element && this.element.remove();
    this.element = null;
    this.subElements = {};
  }

  destroy() {
    this.removeListeners();
    this.remove();
  }
}
