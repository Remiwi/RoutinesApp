export function getIntDate(date: Date) {
    const timezone_offset = date.getTimezoneOffset() * 60 * 1000;
    const ms_since_unix = date.getTime() - timezone_offset;
    const days_since_unix = ms_since_unix / (1000 * 60 * 60 * 24);
    return Math.floor(days_since_unix);
}

export function getToday() {
    return getIntDate(new Date());
}

export function getDaysBack(days: number) {
    const today = getToday();
    return today - days;
}

export function intToDateUTC(intDate: number) {
    return new Date(intDate * 1000 * 60 * 60 * 24);
}

export function intToDateLocal(intDate: number) {
    const timezone_offset = (new Date()).getTimezoneOffset() * 60 * 1000;
    return new Date(intDate * 1000 * 60 * 60 * 24 + timezone_offset);
}0