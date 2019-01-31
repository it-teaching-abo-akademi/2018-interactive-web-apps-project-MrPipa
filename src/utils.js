const API_KEY = "AKO1CDLP4S6165X3";     // Primary key
// const API_KEY = "RPGJ4VR2ME19GAUX";  // Secondary key

var euroValue = 0.87;    // Locally stored USD->EUR exchange rate. Updated on reload. Default 0.8701 31.01.2019

export function getAPIKey(){
    return API_KEY;
}
export function getGuid() {
     function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
export function daysDifference(start, end) {
    let startDate = new Date(start);
    let endDate = new Date(end);
    var timeDiff = endDate.getTime() - startDate.getTime();
    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return diffDays;
}
export function getStockData(callback, symbol, quantity) {
    let url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol="+symbol+"&interval=1min&apikey="+API_KEY;
    xhttpRequest(callback, url, quantity);
}
export function xhttpRequest(callback, file, quantity) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var jsonObj = JSON.parse(this.responseText);
            if (quantity !== null && quantity !== undefined && quantity !== 0) {
                callback(jsonObj, quantity);
            }
            else { callback(jsonObj); }
        }
        if (this.status === 404) {
            error(404, file);
        }
    }
    rawFile.send();
}
export function error(status, file) {
    alert("Error " + status + " while trying to get" + file);
}
export function getExchangeRateUSDtoEUR(callback) {
    let url = "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=EUR&apikey="+API_KEY;
    xhttpRequest(callback, url, null);
}
export function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
                // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}
export function getDate(info) {
    return (parseInt(info.getDay(), 10) + 1) + "/" + (info.getMonth() + 1);
}
export function getRandomColor() {
    var letters = '23456789ABCD';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 12)];
    }
    return color;
}

export function setEuroValue(newValue){
    while (typeof newValue === "string") {
        newValue = JSON.parse(newValue);
    }
    euroValue = newValue;
}
export function getEuroValue(){
    return euroValue;
}