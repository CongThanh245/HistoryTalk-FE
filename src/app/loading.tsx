import LoadingSpinner from "@/components/commons/loading-spinner";

export default function Loading() {
  return (
    <div className="h-screen flex justify-center items-center bg-(var(--abyssal-blue))">
      <LoadingSpinner size={90} />
    </div>
  );
}
