from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import yfinance as yf
import numpy as np
import pandas as pd
import os

app = Flask(__name__, static_url_path='/static')
CORS(app)

def add_cross_signals(data):
    short_window = 50
    long_window = 200
    signals = pd.DataFrame(index=data.index)
    signals['short_mavg'] = data['Close'].rolling(window=short_window, min_periods=1, center=False).mean()
    signals['long_mavg'] = data['Close'].rolling(window=long_window, min_periods=1, center=False).mean()
    signals['signal'] = 0.0
    signals['signal'][short_window:] = np.where(signals['short_mavg'][short_window:] > signals['long_mavg'][short_window:], 1.0, 0.0)   
    signals['positions'] = signals['signal'].diff()
    data['GoldenCross'] = np.where(signals['positions'] == 1, data['Close'], np.nan)
    data['DeathCross'] = np.where(signals['positions'] == -1, data['Close'], np.nan)

@app.route('/')
def serve_homepage():
    return render_template('index.html')

@app.route('/stockdata', methods=['GET'])
def get_stock_data():
    symbol = request.args.get('symbol', default='AAPL', type=str)
    start_date = request.args.get('start_date', default='2020-01-01', type=str)
    end_date = request.args.get('end_date', default='2022-01-01', type=str)

    # Fetch stock data
    data = yf.download(symbol, start=start_date, end=end_date)
    
    # Calculate metrics
    data['SMA'] = data['Close'].rolling(window=50).mean()
    data['UpperBB'] = data['Close'].rolling(window=20).mean() + 2*data['Close'].rolling(window=20).std()
    data['LowerBB'] = data['Close'].rolling(window=20).mean() - 2*data['Close'].rolling(window=20).std()
    delta = data['Close'].diff()
    dUp, dDown = delta.copy(), delta.copy()
    dUp[dUp < 0] = 0
    dDown[dDown > 0] = 0
    RolUp = dUp.rolling(window=14).mean()
    RolDown = dDown.abs().rolling(window=14).mean()
    RS = RolUp / RolDown
    data['RSI'] = 100.0 - (100.0 / (1.0 + RS))
    
    add_cross_signals(data)
    
    # Convert Timestamp keys to string format for JSON serialization
    data_dict = data.to_dict(orient='index')

    # Handle NaN values
    for date, values in data_dict.items():
        for key, value in values.items():
            if pd.isna(value):
                values[key] = None

    data_str_keys = {str(k): v for k, v in data_dict.items()}

    return jsonify(data_str_keys)

@app.route('/backtest', methods=['GET'])
def backtest_strategy():
    symbol = request.args.get('symbol', default='AAPL', type=str)
    start_date = request.args.get('start_date', default='2020-01-01', type=str)
    end_date = request.args.get('end_date', default='2022-01-01', type=str)
    initial_balance = float(request.args.get('starting_balance', default=100000, type=str))
    trade_allocation = float(request.args.get('trade_allocation', default='100', type=str)) / 100
    stop_loss = float(request.args.get('stop_loss', default='0', type=str)) / 100
    take_profit = float(request.args.get('take_profit', default='0', type=str)) / 100

    data = yf.download(symbol, start=start_date, end=end_date)
    add_cross_signals(data)

    # Backtesting logic
    balance = initial_balance
    stock_quantity = 0
    purchase_price = 0  # Keep track of the price we bought the stock at for stop loss/take profit calculations

    for i in range(1, len(data)):
        if not np.isnan(data['GoldenCross'][i]):
            stock_quantity = (balance * trade_allocation) // data['Close'][i]
            balance -= stock_quantity * data['Close'][i]
            purchase_price = data['Close'][i]
        elif not np.isnan(data['DeathCross'][i]) and stock_quantity > 0:
            balance += stock_quantity * data['Close'][i]
            stock_quantity = 0
        elif stock_quantity > 0:
            # Implement Stop Loss
            if data['Close'][i] <= purchase_price * (1 - stop_loss):
                balance += stock_quantity * data['Close'][i]
                stock_quantity = 0
            # Implement Take Profit
            elif data['Close'][i] >= purchase_price * (1 + take_profit):
                balance += stock_quantity * data['Close'][i]
                stock_quantity = 0

    # If still holding stocks, sell them at the last price
    if stock_quantity > 0:
        balance += stock_quantity * data['Close'].iloc[-1]

    total_profit = balance - initial_balance

    return jsonify({
        'totalProfit': total_profit
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)






