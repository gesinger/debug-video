import { useSelector } from 'react-redux';
import { store } from './app/store';
import { setShowPageDetails } from './features/selections/selectionsSlice';
import CollapsibleView from './CollapsibleView';
import PageDetailsHelp from './help/PageDetailsHelp';
import SourceBuffersView from './SourceBuffersView';
import ClipboardCopy from './ClipboardCopy';

export default function PageDetails() {
  const showPageDetails = useSelector((state) => state.selections.showPageDetails);
  const websiteUrl = useSelector((state) => state.sessionInfo.websiteUrl);

  return (
    <CollapsibleView
      isShowing={showPageDetails}
      setIsShowing={(isShowing) => store.dispatch(setShowPageDetails(isShowing))}
      title="Page Details"
      helpChildren={(<PageDetailsHelp />)}
    >
      {websiteUrl && (
        <p className="mb-2">
          <strong>URL</strong>: {websiteUrl}
          <ClipboardCopy title="copy URL to clipboard" text={websiteUrl} />
        </p>
      )}
      <SourceBuffersView />
    </CollapsibleView>
  );
}
