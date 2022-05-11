import { useState } from 'react';
import { ReactComponent as ClipboardCopySvg } from './images/clipboard-copy.svg';
import { ReactComponent as ClipboardCheck } from './images/clipboard-check.svg';

export default function ClipboardCopy({ className, text, title }) {
  const [clicked, setClicked] = useState(false);
  const onClick = () => {
    if (clicked) {
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      setClicked(true);
      setTimeout(() => {
        setClicked(false);
      }, 1500);
    }).catch((e) => {
      console.error(`Failed to copy ${text} to clipboard: ${e}`);
    });
  };

  return (
    <button className={className} onClick={onClick}>
      {!clicked &&
        <ClipboardCopySvg
          title={`${title} success`}
          className="text-primary-50 w-4 h-4 ml-1" />
      }
      {clicked &&
        <ClipboardCheck title={title} className="text-green-500 w-4 h-4 ml-1" />
      }
    </button>
  );
}
