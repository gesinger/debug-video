import { useState } from 'react';
import { ReactComponent as ChevronDown } from './images/chevron-down.svg';
import { ReactComponent as ChevronRight } from './images/chevron-right.svg';
import { ReactComponent as QuestionMarkCircle } from './images/question-mark-circle.svg';

export default function CollapsibleView({
  className,
  children,
  title,
  isShowing,
  setIsShowing,
  helpChildren,
}) {
  const [showHelp, setShowHelp] = useState(false);

  const chevronClass = 'w-3 h-3';
  const helpButtonColor = showHelp ? 'text-sky-500' : 'text-primary-50';

  return (
    <div className={`${className || ''} box`}>
      <div className="flex">
        <button
          className="w-full text-primary-50 hover:text-secondary-200"
          onClick={() => setIsShowing(!isShowing)}
        >
          {isShowing &&
            <ChevronDown className={chevronClass} />
          }
          {!isShowing &&
            <div className="flex">
              <ChevronRight className={chevronClass} />
              <span className="ml-2 align-top">{title}</span>
            </div>
          }
        </button>
        {helpChildren &&
          <button
            className={`${helpButtonColor} hover:text-secondary-200`}
            onClick={() => setShowHelp(!showHelp)}
          >
            <QuestionMarkCircle className={chevronClass} />
          </button>
        }
      </div>
      {isShowing && showHelp && helpChildren}
      {isShowing && children}
    </div>
  );
}
