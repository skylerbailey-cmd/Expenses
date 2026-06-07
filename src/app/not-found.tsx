import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="text-3xl font-bold">Not found</h1>
      <p className="mt-2 text-slate-500">
        That page doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Go home
      </Link>
    </main>
  );
}
