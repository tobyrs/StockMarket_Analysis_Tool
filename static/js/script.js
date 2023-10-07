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
                    onClick: function (e, legendItem) {
                        var index = legendItem.datasetIndex;
                        var ci = this.chart;
                        var alreadyHidden = (ci.getDatasetMeta(index).hidden === null) ? false : ci.getDatasetMeta(index).hidden;

                        ci.data.datasets.forEach(function (e, i) {
                            var meta = ci.getDatasetMeta(i);

                            if (i === index) {
                                meta.hidden = alreadyHidden ? null : true;
                            }
                        });

                        ci.update();
                    },
                    labels: {
                        boxWidth: 20,
                        usePointStyle: true,
                        padding: 20,
                        generateLabels: function (chart) {
                            const items = Chart.overrides.line.plugins.legend.labels.generateLabels.call(this, chart);

                            items.forEach(item => {
                                item.text = '□ ' + item.text;
                            });

                            return items;
                        }
                    },
                    onHover: function (event, legendItem) {
                        document.getElementById('stockChart').style.cursor = 'pointer';
                    },
                    onLeave: function (event, legendItem) {
                        document.getElementById('stockChart').style.cursor = 'default';
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}
