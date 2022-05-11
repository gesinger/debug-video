export default function SegmentsTimelineVizHelp() {
  return (
    <div className="ml-3.5 mt-2 mb-2">
      <p className="text-xl font-bold">Segments/Appends Timeline Visualization</p>
      <div className="mt-2">
        <p><strong>Bottom Axis:</strong> Seconds in segment's internal media time</p>
        <p><strong>Left Axis:</strong> Segment rendition identifier (resolution if available, otherwise bandwidth)</p>
      </div>
      <div className="mt-2">
        <p className="text-xl">Actions</p>
        <ul>
          <li>Click a segment to select it</li>
          <li>Click and drag along the bottom mini-visualization to view a subselection of the timeline</li>
        </ul>
      </div>
      <div className="mt-2">
        <p className="text-xl">Toggle Timelines</p>
        <p>If "Toggle Timelines" appears as a button, then multiple timelines exist, and the visualization is able to turn on/off specific timelines. For HLS, timelines are discontinuity sequences. For DASH, timelines are period starts.</p>
        <p>The reason the timeline toggle is necessary is because discontinuous content may have the same internal (to the media file) start and end times, and may overlap on the visualization.</p>
      </div>
    </div>
  );
}
