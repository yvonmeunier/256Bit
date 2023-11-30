var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=cad&ids=bitcoin%2Cethereum&order=market_cap_desc&per_page=100&page=1&sparkline=true&locale=en";
getData().then(r => {
    const labels = [];
    for (let i = 0; i < 169; i++) {
        labels[i] = i.toString();
    }
    let btcPrices = r[0].sparkline_in_7d.price;
    let ethPrices = r[1].sparkline_in_7d.price;
    var data = {
        labels: labels,
        datasets: [
            {
                label: 'BITCOIN',
                data: btcPrices,
                borderColor: "red",
                backgroundColor: "gold",
                yAxisID: 'y',
            },
            {
                label: 'ETHEREUM',
                data: ethPrices,
                borderColor: "blue",
                backgroundColor: "blue",
                yAxisID: 'y1',
            }
        ]
    };
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            stacked: false,
            plugins: {
                title: {
                    display: true,
                    text: 'BTC and ETH price in USD (7d)'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    // grid line settings
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                },
            }
        },
    };
    let canvas = document.getElementById("graph");
    let ctx = canvas.getContext("2d");
    // @ts-ignore
    new Chart(ctx, config);
});
function getData() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(url);
        const cryptos = yield response.json();
        return cryptos;
    });
}
//# sourceMappingURL=cryptocharts.js.map