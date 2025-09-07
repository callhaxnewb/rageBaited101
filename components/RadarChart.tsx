import React from 'react';
import './RadarChart.css';
import { RadarChartData } from '@/lib/state';

type RadarChartProps = {
  data: RadarChartData;
};

const RadarChart = ({ data }: RadarChartProps) => {
  const labels = Object.keys(data) as (keyof RadarChartData)[];
  const values = Object.values(data);
  const numAxes = labels.length;
  const angleSlice = (Math.PI * 2) / numAxes;

  // Increased dimensions for more padding
  const size = 320;
  const center = size / 2;
  const radius = 100;
  const maxScore = 10;

  const getCoordinates = (index: number, value: number) => {
    const angle = angleSlice * index - Math.PI / 2;
    const r = (radius * value) / maxScore;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  };

  const dataPoints = values.map((value, i) => getCoordinates(i, value)).join(' ');

  const gridLevels = 5;

  return (
    <div className="radar-chart-container">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        className="radar-chart"
      >
        <g className="grid-group">
          {[...Array(gridLevels)].map((_, levelIndex) => (
            <polygon
              key={levelIndex}
              className="grid-level"
              points={[...Array(numAxes)]
                .map((_, i) =>
                  getCoordinates(i, (maxScore / gridLevels) * (levelIndex + 1))
                )
                .join(' ')}
            />
          ))}
        </g>
        <g className="axes-group">
          {labels.map((_, i) => (
            <line
              key={i}
              className="axis-line"
              x1={center}
              y1={center}
              x2={parseFloat(getCoordinates(i, maxScore).split(',')[0])}
              y2={parseFloat(getCoordinates(i, maxScore).split(',')[1])}
            />
          ))}
        </g>
        <g className="labels-group">
          {labels.map((label, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const r = radius + 35; // Position labels further out
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            const textAnchor =
              x < center - 10 ? 'end' : x > center + 10 ? 'start' : 'middle';

            // Wrap multi-word labels
            const words = label.split(' ');
            if (words.length > 1) {
              return (
                <text
                  key={label}
                  x={x}
                  y={y}
                  className="axis-label"
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                >
                  {/* Adjust first line to vertically center the block */}
                  <tspan x={x} dy="-0.6em">
                    {words[0]}
                  </tspan>
                  {/* The second line, handling the '&' if present */}
                  <tspan x={x} dy="1.2em">
                    {words.slice(1).join(' ')}
                  </tspan>
                </text>
              );
            }

            // Render single-word labels
            return (
              <text
                key={label}
                x={x}
                y={y}
                className="axis-label"
                textAnchor={textAnchor}
                dominantBaseline="middle"
              >
                {label}
              </text>
            );
          })}
        </g>
        <polygon className="data-polygon" points={dataPoints} />
      </svg>
    </div>
  );
};

export default RadarChart;