import { LoaderCircle } from "lucide-react";

const Loader = ({ className }: { className?: string }) => (
  <span className={className}>
    <LoaderCircle className="size-4 animate-spin" />
  </span>
);

export { Loader };
