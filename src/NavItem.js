export default function NavItem({ isActive, children, onSelect }) {
  return (
    <li>
      <button
        className={`p-1.5 m-1 ${isActive ? 'bg-sky-500' : ''}`}
        onClick={onSelect}>
        <strong>{children}</strong>
      </button>
    </li>
  );
}
