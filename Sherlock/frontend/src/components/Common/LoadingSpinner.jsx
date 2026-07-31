export default function LoadingSpinner({ text = 'Searching...' }) {
  return (
    <div className="loading-spinner">
      <div className="loading-spinner__ring" />
      <div className="loading-spinner__text">{text}</div>
    </div>
  );
}
