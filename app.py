from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import yfinance as yf
import numpy as np
import pandas as pd
import os

app = Flask(__name__, static_url_path='/static')
CORS(app)

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
    
    # Golden Cross & Death Cross
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
    
    # Convert Timestamp keys to string format for JSON serialization
    data_dict = data.to_dict(orient='index')

    # Handle NaN values
    for date, values in data_dict.items():
        for key, value in values.items():
            if pd.isna(value):
                values[key] = None

    data_str_keys = {str(k): v for k, v in data_dict.items()}

    return jsonify(data_str_keys)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)




