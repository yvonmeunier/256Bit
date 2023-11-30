

const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=cad&ids=bitcoin%2Cethereum&order=market_cap_desc&per_page=100&page=1&sparkline=true&locale=en";


getData().then(r => {
    const labels: string [] = [];

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
    let canvas: any = document.getElementById("graph");
    let ctx: any = canvas.getContext("2d");
    // @ts-ignore
    new Chart(
        ctx,
        config
    );
});
async function getData()
{
    const response = await fetch(url)
    const cryptos = await response.json();
    return cryptos;
}