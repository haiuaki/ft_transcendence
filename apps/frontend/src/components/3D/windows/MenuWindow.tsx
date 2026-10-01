type MenuProps = {
    onClose: () => void;
};

export default function MenuWindow({ onClose }: MenuProps) {
    return (
        <div className="fixed top-5 left-5 z-[9999] w-[420px] rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/10">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-semibold text-black">
                        Menu
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