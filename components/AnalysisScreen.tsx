import './AnalysisScreen.css';
import { useDebate, useUser } from '@/lib/state';
import React, { useEffect } from 'react';
import { Remarkable } from 'remarkable';
import RadarChart from './RadarChart';

const md = new Remarkable();

export default function AnalysisScreen() {
  const {
    analysis,
    isAnalyzing,
    generateAnalysis,
    resetDebate,
    radarChartData,
    overallScore,
  } = useDebate();
  const user = useUser();

  useEffect(() => {
    // Only generate if analysis hasn't been generated yet and we are not already fetching
    if (!analysis && !isAnalyzing) {
      generateAnalysis(user);
    }
  }, [analysis, isAnalyzing, generateAnalysis, user]);

  return (
    <div className="analysis-screen">
      <h2>Post-Game Breakdown</h2>
      {isAnalyzing && <div className="loader">Auditing your aura...</div>}

      {typeof overallScore === 'number' && !isAnalyzing && (
        <div className="overall-score-container">
          <p className="score-title">Your Rage Bait Score</p>
          <div className="score-display">
            <span className="score-value">{overallScore.toFixed(1)}</span>
            <span className="score-max">/ 10</span>
          </div>
        </div>
      )}

      <div className="analysis-layout">
        {radarChartData && (
          <div className="chart-container">
            <RadarChart data={radarChartData} />
          </div>
        )}
        {analysis && (
          <div
            className="analysis-content"
            dangerouslySetInnerHTML={{ __html: md.render(analysis) }}
          />
        )}
      </div>

      <div className="analysis-actions">
        <button onClick={resetDebate} className="button primary">
          Go Again
        </button>
      </div>
    </div>
  );
}