import { useState, useEffect } from 'react';
import { store } from './app/store';
import LoadingSpinner from './LoadingSpinner';
import { setInput as setFocusInput } from './features/focus/focusSlice';

export default function ManifestControlbar({
  url,
  liveRefreshDelay,
  requestManifest,
  loadingDownloadRequests,
}) {
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [refreshDelay, setRefreshDelay] = useState(liveRefreshDelay);

  const isLoading = loadingDownloadRequests.find(
    ({ url: loadingUrl}) => loadingUrl === url);

  useEffect(() => {
    const refreshInterval = isAutoRefresh && refreshDelay > 0 &&
      setInterval(requestManifest, refreshDelay * 1000);

    return () => {
      if (refreshInterval) {
        window.clearInterval(refreshInterval);
      }
    };
  }, [isAutoRefresh, refreshDelay, requestManifest]);

  return (
    <div className="mt-2 mb-2 flex space-x-5">
      {!isLoading && (
        <button className="bordered-button" onClick={() => requestManifest()}>
          <span className="px-1">Refresh</span>
        </button>
      )}
      {isLoading && (
        <div className="mt-2 mb-2 flex">
          <span className="px-1">Loading...</span>
          <LoadingSpinner width={23} height={23} />
        </div>
      )}
      <button
        className={`bordered-button ${isAutoRefresh ? 'bg-sky-500' : ''}`}
        onClick={() => setIsAutoRefresh(!isAutoRefresh)}
      >
        <span className="px-1">Auto Refresh</span>
      </button>
      {isAutoRefresh && (
        <label>
          Every
          <input
            className="w-12 mb-0 mx-2"
            type="number"
            value={refreshDelay}
            onChange={(e) => setRefreshDelay(e.target.value)}
            onFocus={() => store.dispatch(setFocusInput(true))}
            onBlur={() => store.dispatch(setFocusInput(false))}
          />
          seconds
        </label>
      )}
    </div>
  );
}
