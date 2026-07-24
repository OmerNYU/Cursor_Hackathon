import { Camera, CirclePause, CirclePlay, Eye, EyeOff, RotateCcw, Settings2, Sparkles } from 'lucide-react';
import Overlay from './components/Overlay';
import { usePitchSession } from './hooks/usePitchSession';

const labels = [
  ['P', 'Posture', 'P'], ['E', 'Eye contact', 'E'], ['S', 'Motion', 'S'], ['C', 'Pacing', 'C'],
] as const;

function scoreTone(value: number) { return value >= 0.7 ? 'good' : value >= 0.5 ? 'warn' : 'poor'; }

export default function App() {
  const session = usePitchSession();
  const active = session.phase === 'calibrating' || session.phase === 'running' || session.phase === 'paused';
  const scores = session.evaluation?.scores;
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><Sparkles size={19} aria-hidden="true" /><span>PitchMirror</span><small>PRIVATE PRACTICE</small></div>
        <div className="session-status"><i className={active ? 'live-dot' : ''} />{session.phase === 'running' ? 'Live analysis' : session.phase === 'paused' ? 'Paused' : 'On-device coaching'}</div>
      </header>

      <section className="workspace">
        <div className="camera-area">
          <div className="video-stage">
            <video ref={session.videoRef} className="video" muted playsInline autoPlay />
            <Overlay frame={session.frame} visible={session.showOverlay} />
            {!active && <div className="start-state"><div className="camera-mark"><Camera size={31} /></div><h1>Practice in the mirror.</h1><p>Your video stays on this device. We read posture, eye contact, motion, and pacing in real time.</p><button className="primary-button" onClick={session.start}><Camera size={18} />Start session</button></div>}
            {session.phase === 'loading' && <div className="stage-message">Preparing camera and analysis models...</div>}
            {session.phase === 'calibrating' && <div className="calibration"><strong>Center yourself</strong><span>Face the camera, check your lighting, and keep your shoulders in frame.</span><div className="calibration-line" /></div>}
            {session.phase === 'paused' && <div className="stage-message"><CirclePause size={19} /> Analysis paused</div>}
            {session.phase === 'error' && <div className="error-card"><strong>Session could not start</strong><span>{session.error}</span><button className="secondary-button" onClick={session.start}><RotateCcw size={15} />Try again</button></div>}
            {active && <div className="stage-toolbar">
              <button title={session.showOverlay ? 'Hide overlay (O)' : 'Show overlay (O)'} aria-label="Toggle landmark overlay" onClick={() => session.setShowOverlay(!session.showOverlay)}>{session.showOverlay ? <Eye size={17} /> : <EyeOff size={17} />}</button>
              <button title={session.phase === 'paused' ? 'Resume analysis (Space)' : 'Pause analysis (Space)'} aria-label="Pause or resume analysis" onClick={session.togglePause}>{session.phase === 'paused' ? <CirclePlay size={17} /> : <CirclePause size={17} />}</button>
              <button title="End session" aria-label="End session" onClick={session.stop}><RotateCcw size={17} /></button>
            </div>}
          </div>
          <div className="signal-row">
            <span className={session.frame?.quality.poseOk ? 'signal ready' : 'signal'}><i />Body {session.frame?.quality.poseOk ? 'tracked' : 'waiting'}</span>
            <span className={session.frame?.quality.faceOk ? 'signal ready' : 'signal'}><i />Face {session.frame?.quality.faceOk ? 'tracked' : 'waiting'}</span>
            <span>Space pause <b>O</b> overlay <b>D</b> debug</span>
          </div>
        </div>

        <aside className="coach-panel">
          <section className="confidence-block">
            <span className="eyebrow">Confidence</span>
            <div className="confidence-value"><strong>{scores?.overall ?? '--'}</strong><span>/100</span></div>
            <p>{scores ? scores.overall >= 75 ? 'Strong, calm delivery.' : scores.overall >= 55 ? 'Solid foundation. Keep refining.' : 'Settle in and let the feedback guide you.' : 'Start a session to begin.'}</p>
          </section>
          <section className="score-list" aria-label="Confidence subscores">
            {labels.map(([short, label, key]) => {
              const value = scores?.[key] ?? 0;
              return <div className="score-row" key={key}><div><span className={`score-token ${scores ? scoreTone(value) : ''}`}>{short}</span><span>{label}</span></div><strong>{scores ? `${Math.round(value * 100)}%` : '--'}</strong><div className="progress"><i className={scores ? scoreTone(value) : ''} style={{ width: `${value * 100}%` }} /></div></div>;
            })}
          </section>
          <section className="tips-block"><div className="section-heading"><span>Live cues</span><Settings2 size={15} /></div>{session.evaluation?.tips.length ? <div className="tip-list">{session.evaluation.tips.map((tip) => <p key={tip.id}>{tip.message}</p>)}</div> : <p className="empty-tip">Feedback appears after a pattern holds for a moment.</p>}</section>
        </aside>
      </section>
      {session.showDebug && <section className="debug-panel"><span>Analysis {session.debug.fps} FPS</span><span>Detection {session.debug.analysisMs} ms</span><span>Pose {session.frame?.quality.poseOk ? 'available' : 'missing'}</span><span>Face {session.frame?.quality.faceOk ? 'available' : 'missing'}</span></section>}
    </main>
  );
}
