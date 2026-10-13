import SeatProfileWindow, { type SeatProfileWindowProps } from "./SeatProfileWindow";

export default function R1s2Window(props: Omit<SeatProfileWindowProps, "seatIndex">) {
    return <SeatProfileWindow {...props} seatIndex={1} />;
}
