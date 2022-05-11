export default function SelectedSegmentsHelp() {
  return (
    <div className="ml-3.5 mt-2 mb-2">
      <p className="text-xl font-bold">Selected Segments/Appends</p>
      <div className="mt-2">
        <p>Each selected segment is displayed in a rectangle with a highlighted border.</p>
        <div className="mt-2">
          <p>Video segments show a thumbnail of the first frame.</p>
          <p>Audio segments show the segment's waveform.</p>
          <p>Muxed segments show both.</p>
        </div>
        <div className="mt-2">
          <p>All streams within the segment are displayed with their program ID (TS), and a visualization of the media and gaps, calculated by frame duration and frame PTS times. Hover over the visualization for more information about each time range. Gaps are highlighted in red.</p>
          <p>Video streams will show a pie chart of frame types found within the segment.</p>
          <div className="mt-2">
            <p className="font-bold">MP4 Only</p>
              <p>The "Play MP4" button fetches the MP4 from the filesystem and plays it in the app.</p>
              <p>At the bottom, a tree visualization shows all of the segment's boxes. Hover over a box to see its size.</p>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xl font-bold">Keyboard Shortcuts</p>
          <p><span className="font-bold">v</span>: collapse/expand view</p>
          <p><span className="font-bold">z</span>: collapse/expand audio streams</p>
          <p><span className="font-bold">x</span>: collapse/expand video streams</p>
        </div>
      </div>
    </div>
  );
}
