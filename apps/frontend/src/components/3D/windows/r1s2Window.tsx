import SeatProfileWindow from "./SeatProfileWindow";

type R1s2Props = {
    onClose: () => void;
    roomId?: string;
};

export default function R1s2Window(props: R1s2Props) {
    return <SeatProfileWindow {...props} seatIndex={1} />;
}
