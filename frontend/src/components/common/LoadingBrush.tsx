import './LoadingBrush.css';

export default function LoadingBrush({ text = '玄机推演中…' }: { text?: string }) {
  return (
    <div className="loading-brush">
      <div className="brush-stroke"></div>
      <div className="loading-text">{text}</div>
    </div>
  );
}
