import Image from "next/image";
import type { Movie } from "@/lib/movies";
import { cn } from "@/lib/utils";

export default function PosterCard({
  movie,
  priority = false,
  rank,
  className,
}: {
  movie: Movie;
  priority?: boolean;
  rank?: number;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "group relative aspect-2/3 overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/50 hover:ring-primary/60 focus-within:-translate-y-1.5 focus-within:ring-primary/60",
        className,
      )}
    >
      {movie.poster ? (
        <Image
          src={movie.poster}
          alt={`${movie.title} poster`}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          priority={priority}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-secondary font-heading text-4xl text-muted-foreground"
          aria-hidden="true"
        >
          {movie.title.charAt(0)}
        </div>
      )}

      {rank !== undefined && (
        <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-background/80 px-1.5 font-heading text-xs font-semibold text-primary ring-1 ring-border backdrop-blur-sm">
          {rank}
        </span>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/40 to-transparent px-3 pb-3 pt-8">
        <p className="text-sm font-semibold leading-tight text-foreground">
          {movie.title}
        </p>
      </div>
    </li>
  );
}
