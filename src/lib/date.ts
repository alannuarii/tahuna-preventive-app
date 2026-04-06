export const convertTime = (date: string, type: 1 | 2) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    if (type === 1) {
        return `${day}-${month}-${year}`;
    }
    return `${year}-${month}-${day}`;
};
