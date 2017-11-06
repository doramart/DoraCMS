export function cutWords(str, length) {
    let newStr = "";
    if (!str) return '';
    if (str.length > length) {
        newStr = str.substring(0, length) + '...'
    } else {
        newStr = str;
    }
    return newStr;
}