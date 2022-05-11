export const toFixedDisplay = (number, digits) => {
  // remove trailing zeroes
  return Number(number.toFixed(digits));
};

export const renderThumbnailAndWaveform = ({ thumbnail, waveform }) => {
  if (!thumbnail && !waveform) {
    return null;
  }
  const width = thumbnail && waveform ? 'w-36' : 'w-20';

  return (
    <div className={`flex space-x-2 ${width}`}>
      {thumbnail &&
        <img
          src={`data:image/jpg;base64,${thumbnail}`}
          width={64}
          alt="first frame thumbnail" />
      }
      {waveform &&
        <img
          src={`data:image/png;base64,${waveform}`}
          width={64}
          alt="waveform" />
      }
    </div>
  );
};

export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
