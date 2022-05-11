import { useSelector } from 'react-redux';

export default function NavHelp() {
  const manifests = useSelector((state) => state.manifests.value);
  const segments = useSelector((state) => state.segments.value);
  const appends = useSelector((state) => state.appends.value);
  const hasManifests = manifests.length > 0;
  const hasSegments = segments.length > 0;
  const hasAppends = appends.length > 0;

  return (
    <div className="ml-3.5 mt-2 mb-2">
      <p className="text-xl font-bold">View Type Selection</p>
        <div className="mt-2">
          <p className="text-xl font-bold">Keyboard Shortcuts</p>
          {hasAppends && (
            <p><span className="font-bold">a</span>: Appends</p>
          )}
          {hasManifests && (
            <p><span className="font-bold">m</span>: Manifests</p>
          )}
          {hasSegments && (
            <p><span className="font-bold">s</span>: Segments</p>
          )}
        </div>
    </div>
  );
}
