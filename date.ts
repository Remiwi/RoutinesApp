export default function date_to_int(date: Date) {
    const ms_since_unix = date.getTime();
    const days_since_unix = ms_since_unix / (1000 * 60 * 60 * 24);
    return Math.floor(days_since_unix);
}