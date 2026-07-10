export function PageHeader({
  title,
  subtitle,
  eyebrow,
  background = "dark",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  background?: "dark" | "light";
}) {
  const dark = background === "dark";
  return (
    <div
      className={`relative overflow-hidden ${
        dark ? "bg-neutral-900 text-white" : "bg-cream text-neutral-900"
      }`}
    >
      <div className="container-page pt-16 pb-20 text-center sm:pt-20 sm:pb-24">
        {eyebrow && (
          <p className={`text-xs font-bold tracking-widest ${dark ? "text-recette-300" : "text-recette-600"}`}>
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-serif text-3xl font-bold sm:text-5xl">{title}</h1>
        {subtitle && (
          <p className={`mx-auto mt-3 max-w-2xl text-sm sm:text-base ${dark ? "text-white/70" : "text-neutral-500"}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
