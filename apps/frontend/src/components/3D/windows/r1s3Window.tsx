type r1s3Props = {
    onClose: () => void;
};

export default function r1s3Window({ onClose }: r1s3Props) {
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
            <h2>Profil r1s3</h2>

            <button onClick={onClose}>
                Fermer
            </button>
        </div>
    );
}