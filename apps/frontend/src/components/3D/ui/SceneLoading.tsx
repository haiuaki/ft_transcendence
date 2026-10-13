export default function SceneLoading()
{
	return (
		<div className="absolute inset-0 z-10 flex items-center justify-center bg-white text-black">
			<div role="status" aria-live="polite" className="flex flex-col items-center gap-5 px-6 text-center">
				<div aria-hidden="true" className="h-12 w-12 animate-spin rounded-full border-4 border-black/15 border-t-black motion-reduce:animate-none" />
				<p className="text-xl font-medium">Loading …</p>
				<p className="text-sm text-black/60">Kewan is coming. Please wait.</p>
			</div>
		</div>
	);
}
