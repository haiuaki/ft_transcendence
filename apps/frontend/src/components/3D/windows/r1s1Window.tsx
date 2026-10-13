import SeatProfileWindow, { type SeatProfileWindowProps } from "./SeatProfileWindow";

export default function R1s1Window(props: Omit<SeatProfileWindowProps, "seatIndex">) {
    return <SeatProfileWindow {...props} seatIndex={0} />;
}
