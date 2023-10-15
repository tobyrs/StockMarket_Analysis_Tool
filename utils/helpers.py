import pandas as pd
import numpy as np


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