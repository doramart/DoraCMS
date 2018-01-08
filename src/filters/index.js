export function cutWords(str, length) {
    let newStr = "";
    if (!str) return '';
    if (str.replace(/[\u0391-\uFFE5]/g,"aa").length > length) {
        newStr = str.substring(0, length) + '...'
    } else {
        newStr = str;
    }
    return newStr;
}