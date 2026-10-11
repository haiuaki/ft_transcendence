export default function SceneLoading()
{
	return (
		<div className="absolute inset-0 z-10 flex items-center justify-center bg-black text-white">
			<div role="status" aria-live="polite" className="flex flex-col items-center gap-5 px-6 text-center">
				<div aria-hidden="true" className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-700 border-t-white motion-reduce:animate-none" />
				<p className="text-xl font-medium">Loading …</p>
				<p className="text-sm text-neutral-400">Kewan is coming. Please wait.</p>
			</div>
		</div>
	);
}
