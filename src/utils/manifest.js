import { diffLines } from 'diff';

const getManifestString = (manifest) => {
  return manifest.lines.map(({ raw }) => raw).join('\n');
};

export const getDiffLines = (manifest, selectedManifests) => {
  const selectedManifestIndex = selectedManifests.indexOf(manifest);
  const compareManifest = selectedManifestIndex === 0 ? selectedManifests[1] :
    selectedManifests[selectedManifestIndex - 1];
  const showAdditions = selectedManifestIndex > 0;
  const showRemovals = selectedManifestIndex === 0;

  return diffLines(
    getManifestString(manifest), getManifestString(compareManifest)
  ).reduce((acc, { count, added, removed, value }) => {
    if ((!showAdditions && added) || (!showRemovals && removed)) {
      return acc;
    }
    for (let i = 0; i < count; i++) {
      acc.push({ added, removed });
    }
    return acc;
  }, []);
};

export const renderDiffedLine = ({ key, lineContents, showDiff, diff }) => {
  return (
    <div
      key={key}
      className={
        (diff && diff.added) || (showDiff && !diff) ? 'bg-green-800/50' :
        diff && diff.removed ? 'bg-red-800/50' : ''
      }
    >
      {lineContents}
    </div>
  );
};
