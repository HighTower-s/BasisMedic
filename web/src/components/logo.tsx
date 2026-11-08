const LOGO_DOTS = ["fg", "red", "", "red", "red", "red", "fg", "red", ""] as const;

export function Logo() {
  return (
    <span className="grid grid-cols-3 grid-rows-3 gap-[2px] flex-none">
      {LOGO_DOTS.map((c, i) => (
        <i
          key={i}
          className="h-[7px] w-[7px] rounded-[2px]"
          style={{ background: c === "red" ? "#FF4E45" : c === "fg" ? "var(--bm-fg)" : "transparent" }}
        />
      ))}
    </span>
  );
}
