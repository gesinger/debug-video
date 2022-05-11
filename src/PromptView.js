import { useState, useRef } from 'react';
import StreamingMediaViz from './StreamingMediaViz';

export default function PromptView() {
  const [url, setUrl] = useState('');
  const fileInput = useRef(null);
  const sendFile = () => {
    const file = fileInput.current.files[0];
    const name = file.name;
    const mimeType = file.type.toLowerCase();
    const reader = new FileReader();

    reader.onload = (e) => {
      window.electron.send('input-file', {
        mimeType,
        name,
        arrayBuffer: e.target.result
      });
    };
    reader.readAsArrayBuffer(file);
  };
  const sendUrl = () => window.electron.send('input-url', url);

  return (
    <div className="text-lg flex w-screen items-center" style={{ height: '75vh' }}>
      <div className="w-2/3 flex flex-col ml-8">
        <div className="text-4xl font-bold">
          Welcome to <span className="debug-video-title">debug.video</span>
        </div>
        <div className="mt-16 flex flex-col items-left">
          <p>Enter a URL to a manifest, segment, or website that uses Media Source Extensions</p>
          <div>
            <input
              className="w-3/4"
              style={{ padding: '0.45rem' }}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendUrl()}
            />
            <button
              className="w-1/5 bordered-button"
              style={{ padding: '0.45rem' }}
              onClick={sendUrl}>
              submit
            </button>
          </div>
        </div>
        <div className="mt-16 flex flex-col items-left">
          <p>Upload a manifest, segment, HAR, or dbgvid file from your computer</p>
          <div>
            <input
              className="w-3/4"
              type="file"
              ref={fileInput}
            />
            <button
              className="w-1/5 bordered-button"
              style={{ padding: '0.45rem' }}
              onClick={sendFile}>
              submit
            </button>
          </div>
        </div>
      </div>
      <div className="mt-2" style={{ width: 500 }}>
        <StreamingMediaViz />
      </div>
    </div>
  );
}
