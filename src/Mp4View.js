import { useState, useEffect } from 'react';
import Mp4BoxViz from './Mp4BoxViz';

export default function Mp4View({ className, mp4Details }) {
  const [mp4Base64, setMp4Base64] = useState();
  const { mimeType, path, boxes } = mp4Details;

  useEffect(() => {
    const base64Listener = (e, data) => {
      if (data.path === path) {
        setMp4Base64(data.base64);
      }
    };

    window.electron.on('mp4-base64', base64Listener);

    return () => {
      window.electron.off('mp4-base64', base64Listener);
    };
  }, [path, setMp4Base64]);

  return (
    <div className={className}>
      <p>
        {mp4Base64 &&
          <video width={320} height={240} controls>
            <source src={`data:video/mp4;base64,${mp4Base64}`} type={mimeType} />
          </video>
        }
      </p>
      <p>
        {!mp4Base64 &&
          <button
            className="bordered-button"
            onClick={() => window.electron.send('mp4-base64-request', { path })}
          >
            <span className="px-1">Play MP4</span>
          </button>
        }
      </p>
      {boxes &&
        <div>
          <Mp4BoxViz boxes={boxes} />
        </div>
      }
    </div>
  );
};
