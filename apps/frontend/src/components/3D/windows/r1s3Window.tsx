import SeatProfileWindow from "./SeatProfileWindow";

type R1s3Props = {
    onClose: () => void;
    roomId?: string;
};

export default function R1s3Window(props: R1s3Props) {
    return <SeatProfileWindow {...props} seatIndex={2} />;
}
