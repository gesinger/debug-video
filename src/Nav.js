import { useState } from 'react';
import NavHelp from './help/NavHelp';
import { ReactComponent as QuestionMarkCircle } from './images/question-mark-circle.svg';

export default function Nav({ children }) {
  const [showHelp, setShowHelp] = useState(false);

  const helpButtonColor = showHelp ? 'text-sky-500' : 'text-primary-50';

  // Margin right is an exact value as it's 1px more than w-4, which should put the
  // question mark inline with the other question marks that are within a 1px border box.
  return (
    <nav className="ml-2">
      <div className="flex mr-[17px]">
        <ul className="w-full flex space-x-2">
          {children}
        </ul>
        <button
          className={`${helpButtonColor} hover:text-secondary-200`}
          onClick={() => setShowHelp(!showHelp)}
        >
          <QuestionMarkCircle className="w-3 h-3" />
        </button>
      </div>
      {showHelp &&
        <NavHelp />
      }
    </nav>
  );
}
