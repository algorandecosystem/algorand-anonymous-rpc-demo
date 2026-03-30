import DynamicOhttp from "./DynamicOhttp";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950 px-4 py-16">
      <DynamicOhttp />
    </main>
  );
}
