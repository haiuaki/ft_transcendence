import SeatProfileWindow from "./SeatProfileWindow";

type R1s1Props = {
    onClose: () => void;
    roomId?: string;
};

export default function R1s1Window(props: R1s1Props) {
    return <SeatProfileWindow {...props} seatIndex={0} />;
}
