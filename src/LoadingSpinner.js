import { ReactComponent as PuffSpinner } from './images/puff.svg';

export default function LoadingSpinner({ width = 40, height = 40 }) {
  return (
    <PuffSpinner width={width} height={height} />
  );
}
