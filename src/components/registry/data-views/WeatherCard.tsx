'use client';

import React from 'react';

interface WeatherCardProps {
  data: any;
}

export function WeatherCard({ data }: WeatherCardProps) {
  // Try to extract known open-meteo or generic weather fields
  const current = data.current_weather || data.current || data;
  const temp = current?.temperature ?? current?.temp_c ?? current?.temp ?? '--';
  const wind = current?.windspeed ?? current?.wind_kph ?? current?.wind_speed ?? '--';
  const time = current?.time || new Date().toISOString();
  
  const lat = data.latitude ?? data.lat;
  const lon = data.longitude ?? data.lon;
  const timezone = data.timezone || data.tz_id || 'Unknown Location';

  return (
    <div className="weather-card">
      <div className="weather-card__header">
        <div className="weather-card__location">
          <span className="weather-card__icon">📍</span>
          <div>
            <h3>{timezone}</h3>
            {lat !== undefined && lon !== undefined && (
              <span className="weather-card__coords">{lat.toFixed(2)}°, {lon.toFixed(2)}°</span>
            )}
          </div>
        </div>
        <div className="weather-card__time">
          {new Date(time).toLocaleDateString()} {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      <div className="weather-card__main">
        {temp !== '--' ? (
          <div className="weather-card__temp">
            <span className="weather-card__temp-value">{temp}</span>
            <span className="weather-card__temp-unit">°</span>
          </div>
        ) : (
          <div className="weather-card__hint">
            Tip: Add the `current_weather=true` parameter to see the temperature.
          </div>
        )}
        <div className="weather-card__details">
          {wind !== '--' && (
            <div className="weather-detail">
              <span className="weather-detail__label">Wind Speed</span>
              <span className="weather-detail__value">{wind} km/h</span>
            </div>
          )}
          {data.elevation !== undefined && (
            <div className="weather-detail">
              <span className="weather-detail__label">Elevation</span>
              <span className="weather-detail__value">{data.elevation}m</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
