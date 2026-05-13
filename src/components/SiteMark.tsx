export function SiteMark({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-8 w-8 shrink-0 text-sky-700"}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M16 3 5 8v8.5c0 5.2 3.5 9.8 11 12.5l.5.2.5-.2c7.5-2.7 11-7.3 11-12.5V8L16 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M11.5 15.5 14.5 18.5 21 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
