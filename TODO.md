# TODO

Manifests:
* Overlay to show appends
  * Longest common substring and close time stamps for matching appends to segments
* View with key attributes
* Detect non-discontinuity gaps between segments in manifest for probed segments
* Detect audio/video not synced
* HLS detect variants with different target durations
* DASH SegmentTemplate with byterange (find content)
* DASH SegmentList (find content)
* Warning when segment does not have same streams as others
* Warning when multiple program IDs for same media type
* Warning for changing sample rate

Segments:
* VTT saving and viewing
* Diff view (streams and frames)
* Bytes view (request with click)

Appends
* Save timestamp offset
* Auto discover errors
* Different browser append modes

Appends/Segments:
* Filters by ffprobe results

Other:
* Persist preferences
* Table filtering
* Split view and tabs
* Support passing in multiple segments, manifests, init segments 
* Capture updateend events and keep buffer updated
* Make custom manifests in debugger with smaller numbers of segments (single segment)
* Online and devtools versions with local storage or file system api
  (and a replacement for ffmpeg/ffprobe)
* Theming
* Tests
* Windows build
