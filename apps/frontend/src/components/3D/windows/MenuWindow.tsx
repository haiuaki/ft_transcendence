type MenuWindowProps = {
    onClose: () => void;
};

export default function MenuWindow({ onClose }: MenuWindowProps) {
    return (
        <div
            style={{
                position: "fixed",
                top: "20px",
                left: "20px",
                zIndex: 9999,
                background: "white",
                color: "black",
                padding: "30px",
                border: "2px solid black",
            }}
        >
            <h2>MENU OUVERT</h2>

            <button onClick={onClose}>
                Fermer
            </button>
        </div>
    );
}