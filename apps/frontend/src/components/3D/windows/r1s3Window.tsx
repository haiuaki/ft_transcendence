type R1s3Props = {
    onClose: () => void;
};

export default function R1s3Window({ onClose }: R1s3Props) {
    return (
        <div className="fixed top-5 right-5 z-[9999] w-[420px] rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/10">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-semibold text-black">
                        R1s3 profile
                    </h2>

                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-black/50 transition-all duration-200 hover:bg-black/5 hover:text-black"
                    >
                        ✕
                    </button>
                </div>

            </div>
        </div>
    );
}