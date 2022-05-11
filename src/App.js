import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { store } from './app/store';
import PromptView from './PromptView';
import AppendsView from './AppendsView';
import ManifestsView from './ManifestsView';
import SegmentsView from './SegmentsView';
import LoadingSpinner from './LoadingSpinner';
import { ReactComponent as ExclamationCircle } from './images/exclamation-circle.svg';
import Preferences from './Preferences';
import PageDetails from './PageDetails';
import { setSelectedView } from './features/selections/selectionsSlice';
import Nav from './Nav';
import NavItem from './NavItem';

export default function App(props) {
  const websiteUrl = useSelector((state) => state.sessionInfo.websiteUrl);
  const manifests = useSelector((state) => state.manifests.value);
  const segments = useSelector((state) => state.segments.value);
  const appends = useSelector((state) => state.appends.value);
  const failedInput = useSelector((state) => state.sessionInfo.failedInput);
  const isLoading = useSelector((state) => state.sessionInfo.loadingInput);
  const ffprobeExists = useSelector((state) => state.capabilities.ffprobeExists);
  const showPreferences = useSelector((state) => state.preferences.showPreferences);
  const selectedView = useSelector((state) => state.selections.selectedView);
  const [isExporting, setIsExporting] = useState(false);

  const hasWebsiteUrl = !!websiteUrl;
  const hasAppends = !!appends.length;
  const hasManifests = !!manifests.length;
  const hasSegments = !!segments.length;
  const views = [
    ...(hasAppends ? [{ title: 'Appends', value: 'appends' }] : []),
    ...(hasManifests ? [{ title: 'Manifests', value: 'manifests' }] : []),
    ...(hasSegments ? [{ title: 'Segments', value: 'segments' }] : []),
  ];

  // a selected view can't be chosen until the view types available exist (once appends,
  // manifests, or segments are available)
  if (!selectedView && views.length) {
    store.dispatch(setSelectedView(views[0].value));
  }

  useEffect(() => {
    const onExporting = (e) => setIsExporting(true);
    const onFinishedExporting = (e) => setIsExporting(false);

    window.electron.on('exporting', onExporting);
    window.electron.on('finished-exporting', onFinishedExporting);

    return () => {
      window.electron.off('exporting', onExporting);
      window.electron.off('finished-exporting', onFinishedExporting);
    };
  }, [setIsExporting]);

  const showPrompt = !hasWebsiteUrl && !hasAppends && !hasManifests && !hasSegments;

  return (
    <div className="min-h-screen bg-primary-800 text-primary-50 flex flex-col text-base">
      {showPreferences &&
        <Preferences />
      }
      {ffprobeExists === false &&
        <div className="my-4 flex justify-center items-center space-x-2">
          <ExclamationCircle  className="block text-red-500 w-5 h-5" />
          <div>ffprobe doesn't exist and is required for sgment probing</div>
        </div>
      }
      {isLoading &&
        <div className="m-1 flex justify-center items-center space-x-2">
          <LoadingSpinner />
          <div>Loading...</div>
        </div>
      }
      {isExporting &&
        <div className="m-1 flex justify-center items-center space-x-2">
          <LoadingSpinner />
          <div>Exporting...</div>
        </div>
      }
      {failedInput &&
        <div className="my-4 flex flex-col justify-center items-center">
          <div className="flex space-x-2">
            <ExclamationCircle  className="block text-red-500 w-5 h-5" />
            <p>Failed to load URL: {failedInput.error.name} [{failedInput.error.code}]</p>
          </div>
          <div>{failedInput.error.message}</div>
        </div>
      }
      {showPrompt &&
        <PromptView />
      }
      {websiteUrl &&
        <PageDetails />
      }
      {views.length > 0 && (
        <Nav>
          {views.map(({ title, value }) => (
            <NavItem
              key={value}
              onSelect={() => store.dispatch(setSelectedView(value))}
              isActive={selectedView === value}>
              {title}
            </NavItem>
          ))}
        </Nav>
      )}
      <div className='h-full max-h-full flex flex-col'>
        {selectedView === 'appends' && hasAppends && (
          <AppendsView />
        )}
        {selectedView === 'manifests' && hasManifests && (
          <ManifestsView />
        )}
        {selectedView === 'segments' && hasSegments && (
          <SegmentsView />
        )}
      </div>
    </div>
  );
}
