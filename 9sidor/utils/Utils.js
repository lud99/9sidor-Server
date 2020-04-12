// Replace a string with another string
String.prototype.replaceAll = function (target, replace = "") { return this.split(target).join(replace); }

// Capitalize a string
String.prototype.capitalize = function () { return this[0].toUpperCase() + this.slice(1) }; 

// Clear the console
console.clear = () => process.stdout.write("\u001b[2J\u001b[0;0H");

// Validate hex color
String.prototype.validHexColor = function () { return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(this); }

// Remove special characters
String.prototype.removeSpecialCharacters = function () {
    // Remove å, ä, ö and accents
    let string = this.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Remove emojis
    return string.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
}

// Remove multiple spaces
String.prototype.removeMultipleSpaces = function () { return this.replace(/\s\s+/g, ' '); }

String.prototype.getSearchQuery = function () {
    const query = new URL("http://localhost" + this).search.slice(1).split("&");

    if (query == "") return {};

    var res = {};
    for (var i = 0; i < query.length; ++i)
    {
        var p = query[i].split('=', 2);
        if (p.length == 1)
            res[p[0]] = "";
        else
            res[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }

    return res;
}