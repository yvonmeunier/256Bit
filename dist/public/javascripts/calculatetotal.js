const btcPrice = document.getElementById("btcPrice").innerText;
const ethPrice = document.getElementById("ethPrice").innerText;
const priceElem = document.getElementById("price");
const amountElem = document.getElementById("amount");
const currencyElems = document.querySelectorAll('input[name="currency"]');
amountElem.addEventListener("input", () => {
    updatePrice();
});
for (let currencyElem of currencyElems) {
    currencyElem.addEventListener("change", () => {
        updatePrice();
    });
}
function updatePrice() {
    // @ts-ignore
    let amount = amountElem.value;
    if (amount == "" || isNaN(parseFloat(amount))) {
        amount = "0";
    }
    let currency = document.querySelector('input[name="currency"]:checked').getAttribute("value");
    if (currency == "btc") {
        priceElem.innerText = "PRICE : " + (parseFloat(btcPrice) * parseFloat(amount)).toFixed(2).toString() + "$";
    }
    else {
        priceElem.innerText = "PRICE : " + (parseFloat(ethPrice) * parseFloat(amount)).toFixed(2).toString() + "$";
    }
}
//# sourceMappingURL=calculatetotal.js.map