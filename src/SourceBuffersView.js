import { useSelector } from 'react-redux';

export default function SourceBuffersView() {
  const sourceBuffers = useSelector((state) => state.sourceBuffers.value);

  return (
    <div>
      {sourceBuffers &&
        <span>
          <strong>Source Buffers: </strong>
          {sourceBuffers.map((sourceBuffer, index) =>
            <span key={sourceBuffer}>
              {index > 0 &&
                <span> | </span>
              }
              {sourceBuffer}
            </span>
          )}
        </span>
      }
    </div>
  );
}
