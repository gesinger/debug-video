import { store } from './app/store';
import { useSelector } from 'react-redux';
import {
  setShowPreferences,
  setUseKeyboardShortcuts,
  setUseNumberKeyboardShortcuts,
  setMaxTableHeight,
  setUseMaxTableHeight,
} from './features/preferences/preferencesSlice';
import { setInput as setFocusInput } from './features/focus/focusSlice';
import { ReactComponent as XCircle } from './images/x-circle.svg';

export default function Preferences() {
  const useKeyboardShortcuts = useSelector((state) =>
    state.preferences.useKeyboardShortcuts);
  const useNumberKeyboardShortcuts = useSelector((state) =>
    state.preferences.useNumberKeyboardShortcuts);
  const maxTableHeight = useSelector((state) => state.preferences.maxTableHeight);
  const useMaxTableHeight = useSelector((state) => state.preferences.useMaxTableHeight);

  return (
    <div className="m-2 flex">
      <div>
        <p className="text-2xl font-bold">Preferences</p>
        <div className="mt-4">
          <fieldset>
            <p>
              <input
                type="checkbox"
                id="useKeyboardShortcuts"
                checked={useKeyboardShortcuts}
                onChange={(e) => store.dispatch(setUseKeyboardShortcuts(e.target.checked))}
              />
              <label htmlFor="useKeyboardShortcuts" className="ml-2">
                Use keyboard shortcuts
              </label>
            </p>

            <p>
              <input
                type="checkbox"
                id="useNumberKeyboardShortcuts"
                checked={useNumberKeyboardShortcuts}
                onChange={
                  (e) => store.dispatch(setUseNumberKeyboardShortcuts(e.target.checked))
                }
              />
              <label htmlFor="useNumberKeyboardShortcuts" className="ml-2">
                Use 0-9 keyboard shortcuts for table row selections
              </label>
            </p>

            <p>
              <input
                type="checkbox"
                id="useMaxTableHeight"
                checked={useMaxTableHeight}
                onChange={
                  (e) => store.dispatch(setUseMaxTableHeight(e.target.checked))
                }
              />
              <label htmlFor="useMaxTableHeight" className="ml-2">
                Use a maximum height for tables
              </label>

              {useMaxTableHeight && (
                <input
                  className="w-16 ml-4"
                  type="number"
                  value={maxTableHeight}
                  onChange={(e) => store.dispatch(setMaxTableHeight(e.target.value))}
                  onFocus={() => store.dispatch(setFocusInput(true))}
                  onBlur={() => store.dispatch(setFocusInput(false))}
                />
              )}
            </p>
          </fieldset>
        </div>
      </div>
      <button
        className="ml-auto"
        onClick={() => store.dispatch(setShowPreferences(false))}
      >
        <XCircle className="w-8 h-8" />
      </button>
    </div>
  );
}
