let myChart = null;

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

// Event Listeners for inputs and sliders
document.getElementById('symbol').addEventListener('change', function() {
    debounce(fetchStockData, 500)();
    debounce(backTestStrategy, 500)();
});
document.getElementById('start_date').addEventListener('change', function() {
    debounce(fetchStockData, 500)();
    debounce(backTestStrategy, 500)();
});
document.getElementById('end_date').addEventListener('change', function() {
    debounce(fetchStockData, 500)();
    debounce(backTestStrategy, 500)();
});

document.getElementById('allocation').addEventListener('change', function() {
    updateAllocationValue(this.value);
    debounce(backTestStrategy, 500)();
});

document.getElementById('stoploss').addEventListener('change', function() {
    updateStopLossValue(this.value);
    debounce(backTestStrategy, 500)();
});

document.getElementById('takeprofit').addEventListener('change', function() {
    updateTakeProfitValue(this.value);
    debounce(backTestStrategy, 500)();
});


function backTestStrategy() {
    const symbol = document.getElementById('symbol').value || 'AAPL';
    const start_date = document.getElementById('start_date').value || '2020-01-01';
    const end_date = document.getElementById('end_date').value || '2022-01-01';
    const starting_balance = document.getElementById('starting_balance').value || '100000';
    const trade_allocation = document.getElementById('allocation').value || '100';  // Corrected ID
    const stop_loss = document.getElementById('stoploss').value || '0';           // Corrected ID
    const take_profit = document.getElementById('takeprofit').value || '0';       // Corrected ID

    fetch(`/backtest?symbol=${symbol}&start_date=${start_date}&end_date=${end_date}&starting_balance=${starting_balance}&trade_allocation=${trade_allocation}&stop_loss=${stop_loss}&take_profit=${take_profit}`)
        .then(response => response.json())
        .then(data => {
            const resultsDiv = document.getElementById('strategyResults');
            const totalProfit = data.totalProfit ? `$${data.totalProfit.toFixed(2)}` : 'N/A';
            const maxDrawdown = data.maxDrawdown ? `${data.maxDrawdown.toFixed(2)}%` : 'N/A';
            const annualizedReturn = data.annualizedReturn ? `${data.annualizedReturn.toFixed(2)}%` : 'N/A';
            
            resultsDiv.innerHTML = `
                <strong>Analysis Details:</strong><br>
                Stock Symbol: ${symbol}<br>
                Date Range: ${start_date} to ${end_date}<br>
                Strategy: Golden Cross / Death Cross<br>
                Starting Balance: $${starting_balance}<br>
                -----------------------------------<br>
                Total Profit/Loss: ${totalProfit}<br>
                Maximum Drawdown: ${maxDrawdown}<br>
                Annualized Return: ${annualizedReturn}
            `;
        });
}


function fetchStockData() {
    const symbol = document.getElementById('symbol').value || 'AAPL';
    const start_date = document.getElementById('start_date').value || '2020-01-01';
    const end_date = document.getElementById('end_date').value || '2022-01-01';
    
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    
    fetch(`/stockdata?symbol=${symbol}&start_date=${start_date}&end_date=${end_date}`)
        .then(response => {
            document.getElementById('loading').style.display = 'none';
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            if(Object.keys(data).length === 0) {
                document.getElementById('results').innerText = 'No data available for the given dates or stock symbol.';
            } else {
                renderChart(data);
            }
        })
        .catch(error => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
            console.error("There was a problem fetching stock data:", error);
        });
}

function renderChart(data) {
    if (!data || Object.keys(data).length === 0) {
        // If there's no data, render an empty placeholder chart
        data = {
            labels: ['Placeholder Start', 'Placeholder End'],
            datasets: [{
                label: 'No Data',
                data: [0, 1],
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 2,
                fill: false
            }]
        };
    } else {
        const labels = Object.keys(data);
    const datasets = [
        { label: 'Open', data: labels.map(date => data[date].Open), borderColor: 'blue', fill: false },
        { label: 'High', data: labels.map(date => data[date].High), borderColor: 'green', fill: false },
        { label: 'Low', data: labels.map(date => data[date].Low), borderColor: 'red', fill: false },
        { label: 'Close', data: labels.map(date => data[date].Close), borderColor: 'orange', fill: false },
        { label: 'SMA', data: labels.map(date => data[date].SMA), borderColor: 'purple', fill: false, hidden: true },
        { label: 'Golden Cross', data: labels.map(date => data[date].GoldenCross), borderColor: 'gold', fill: false, pointRadius: 5, pointHoverRadius: 7 },
        { label: 'Death Cross', data: labels.map(date => data[date].DeathCross), borderColor: 'black', fill: false, pointRadius: 5, pointHoverRadius: 7 },
        { label: 'UpperBB', data: labels.map(date => data[date].UpperBB), borderColor: 'cyan', fill: false, hidden: true },
        { label: 'LowerBB', data: labels.map(date => data[date].LowerBB), borderColor: 'pink', fill: false, hidden: true },
        { label: 'RSI', data: labels.map(date => data[date].RSI), borderColor: 'brown', fill: false, hidden: true }
    ];

    if (myChart) {
        myChart.destroy(); // destroy previous chart instance if it exists
    }

    const ctx = document.getElementById('stockChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    type: 'timeseries',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM d'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            weight: 'normal'
                        },
                        onHover: function(event, legendItem) {
                            this.chart.legend.legendItems[legendItem.index].font.weight = 'bold';
                            this.chart.draw();
                        },
                        onLeave: function(event, legendItem) {
                            this.chart.legend.legendItems[legendItem.index].font.weight = 'normal';
                            this.chart.draw();
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            }
        }
    });

    }
    }
//sliders 
function updateAllocationValue(val) {
    document.getElementById('allocationValue').innerText = val;
}

function updateStopLossValue(val) {
    document.getElementById('stopLossValue').innerText = val;
}

function updateTakeProfitValue(val) {
    document.getElementById('takeProfitValue').innerText = val;
}

// Render an empty chart on initial page load
renderChart(null);
