import { useState } from 'react';
import { ReactComponent as CheckCircle } from './images/check-circle.svg';
import { ReactComponent as MinusCircle } from './images/minus-circle.svg';

const getCircle = ({ isSelected, item, toggleSelected }) => {
  const className = "cursor-pointer w-5 h-5";

  if (isSelected) {
    return (
      <CheckCircle onClick={toggleSelected} className={`${className} selected-green`} />
    );
  }

  return (
    <MinusCircle onClick={toggleSelected} className={className} />
  );
};

export default function MultiSelectDropdown({
  label,
  items,
  selected,
  selectItem,
  unselectItem,
  showAll,
  setShowAll,
}) {
  const [isDroppedDown, setIsDroppedDown] = useState(false);

  return (
    <div>
      <button
        className={`bordered-button ${isDroppedDown ? 'bg-sky-500' : ''}`}
        onClick={() => setIsDroppedDown(!isDroppedDown)}
      >
        <span className="px-1">{label}</span>
      </button>
      {isDroppedDown && !!setShowAll && (
        <div className="mt-2">
          <button
            className={`bordered-button ${showAll ? 'bg-sky-500' : ''}`}
            onClick={() => setShowAll(!showAll)}
          >
            <span className="px-1">Show All</span>
          </button>
        </div>
      )}
      {isDroppedDown && (
        <div className="mt-2">
          {items.map((item) => {
            const isSelected = selected.includes(item);
            const toggleSelected = () => {
              if (isSelected) {
                unselectItem(item);
                return;
              }

              selectItem(item);
            };
            const circle = getCircle({ isSelected, item, toggleSelected });

            return (
              <div key={item} className="flex space-x-1 mt-1">
                {circle}
                <div className="cursor-pointer" onClick={toggleSelected}>
                  {typeof item === 'object' ? item.title : item}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
