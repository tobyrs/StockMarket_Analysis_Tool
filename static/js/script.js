let myChart = null;

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
