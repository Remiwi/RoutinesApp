export default class JustDate {
  private daysSinceEpoch: number;

  constructor();
  constructor(justDate: JustDate);
  constructor(daysSinceEpoch: number);
  constructor(year: number, month: number, day: number);
  constructor(...args: any[]) {
    if (args.length === 0) {
      const today = new Date();
      const timezoneOffset = today.getTimezoneOffset() * 60 * 1000;
      this.daysSinceEpoch = Math.floor((today.getTime() - timezoneOffset) / (24 * 60 * 60 * 1000));
    }
    else if (args.length === 1) {
      if (args[0] instanceof JustDate) 
        this.daysSinceEpoch = args[0].daysSinceEpoch;
      else
        this.daysSinceEpoch = args[0];
    }
    else if (args.length === 3) {
      const day = new Date(args[0], args[1], args[2]);
      const timezoneOffset = day.getTimezoneOffset() * 60 * 1000;
      this.daysSinceEpoch = Math.floor((day.getTime() - timezoneOffset) / (24 * 60 * 60 * 1000));
    }
    else {
      throw new Error('Invalid arguments');
    }
  }

  // Getters

  public getDaysSinceEpoch(): number {
    return this.daysSinceEpoch;
  }

  public getDate(): [year: number, month: number, day: number] {
    let date = new Date(this.daysSinceEpoch * 24 * 60 * 60 * 1000);
    const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
    date = new Date(date.getTime() + timezoneOffset);
    return [date.getFullYear(), date.getMonth(), date.getDate()];
  }

  public getYear(): number {
    return this.getDate()[0];
  }

  public getMonth(): number {
    return this.getDate()[1];
  }

  public getMonthName(): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'];
    return monthNames[this.getMonth()];
  }

  public getDay(): number {
    return this.getDate()[2];
  }

  public getWeekDay(): number {
    let date = new Date(this.daysSinceEpoch * 24 * 60 * 60 * 1000);
    const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
    date = new Date(date.getTime() + timezoneOffset);

    return date.getDay();
  }

  public getWeekDayName(): string {
    const weekDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekDayNames[this.getWeekDay()];
  }

  public getFullDate(): string {
    const [year, month, day] = this.getDate();
    return `${year}-${(month+1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  public getMonthLength(): number {
    const monthStart = this.shiftToMonthStart();
    const monthEnd = monthStart.shiftMonths(1).shiftDays(-1);
    return monthEnd.getDay();
  }

  public getYearLength(): number {
    const lastDayInFeb = new JustDate(this.getYear(), 2, 1).shiftDays(-1);
    return lastDayInFeb.getDay() === 29 ? 366 : 365;
  }

  public toString(): string {
    return this.getFullDate();
  }

  public toInt(): number {
    return this.daysSinceEpoch;
  }

  // Operators

  public shiftDays(days: number): JustDate {
    return new JustDate(this.daysSinceEpoch + days);
  }

  public shiftMonths(months: number): JustDate {
    const [year, month, day] = this.getDate();
    return new JustDate(year, month + months, day);
  }

  public shiftYears(years: number): JustDate {
    const [year, month, day] = this.getDate();
    return new JustDate(year + years, month, day);
  }

  public shiftToDay(day: number): JustDate {
    const [year, month, _] = this.getDate();
    return new JustDate(year, month, day);
  }

  public shiftToMonth(month: number): JustDate {
    const [year, _, day] = this.getDate();
    return new JustDate(year, month, day);
  }

  public shiftToYear(year: number): JustDate {
    const [_, month, day] = this.getDate();
    return new JustDate(year, month, day);
  }

  public shiftToWeekStart(): JustDate {
    return new JustDate(this.daysSinceEpoch - this.getWeekDay());
  }

  public shiftToMonthStart(): JustDate {
    const [year, month, _] = this.getDate();
    return new JustDate(year, month, 1);
  }

  public shiftToYearStart(): JustDate {
    const [year, _, __] = this.getDate();
    return new JustDate(year, 0, 1);
  }

  public getDifference(other: JustDate|number): number {
    if (other instanceof JustDate)
      return this.daysSinceEpoch - other.daysSinceEpoch;
    else
      return this.daysSinceEpoch - other;
  }

  // Comparators

  public isBefore(other: JustDate): boolean {
    return this.daysSinceEpoch < other.daysSinceEpoch;
  }

  public isAfter(other: JustDate): boolean {
    return this.daysSinceEpoch > other.daysSinceEpoch;
  }

  public isSame(other: JustDate): boolean {
    return this.daysSinceEpoch === other.daysSinceEpoch;
  }

  public isDifferent(other: JustDate): boolean {
    return this.daysSinceEpoch !== other.daysSinceEpoch;
  }

  public isSameOrBefore(other: JustDate): boolean {
    return this.daysSinceEpoch <= other.daysSinceEpoch;
  }

  public isSameOrAfter(other: JustDate): boolean {
    return this.daysSinceEpoch >= other.daysSinceEpoch;
  }

  // Other utilities

  public static getAllDaysBetween(left: JustDate|number, right: JustDate|number, includeStart?: boolean, includeEnd?: boolean): JustDate[] {
    // Fudging parameters
    if (left instanceof JustDate)
      left = left.daysSinceEpoch;
    if (right instanceof JustDate)
      right = right.daysSinceEpoch;
    if (includeStart === undefined)
      includeStart = true;
    if (includeEnd === undefined)
      includeEnd = false;

    // Configuring loop ends
    if (!includeStart)
      left++;
    if (includeEnd)
      right++;
    
    const days: JustDate[] = [];
    for (let i = left; i < right; i++) {
      days.push(new JustDate(i));
    }
    return days;
  }

  public getAllDaysInWeek(): JustDate[] {
    const weekStart = this.shiftToWeekStart();
    const week: JustDate[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(weekStart.shiftDays(i));
    }
    return week;
  }

  public getAllDaysInMonth(): JustDate[] {
    const monthStart = this.shiftToMonthStart();
    const month: JustDate[] = [];
    for (let i = 0; i < this.getMonthLength(); i++) {
      month.push(monthStart.shiftDays(i));
    }
    return month;
  }

  public getAllDaysInYear(): JustDate[] {
    const yearStart = this.shiftToYearStart();
    const year: JustDate[] = [];
    for (let i = 0; i < this.getYearLength(); i++) {
      year.push(yearStart.shiftDays(i));
    }
    return year;
  }

  public static today(): JustDate {
    return new JustDate();
  }

  public static tomorrow(): JustDate {
    return new JustDate().shiftDays(1);
  }

  public static yesterday(): JustDate {
    return new JustDate().shiftDays(-1);
  }
}