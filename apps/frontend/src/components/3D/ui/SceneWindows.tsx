import KewanWindow from "../windows/KewanWindow";
import R1s1Window from "../windows/r1s1Window";
import R1s2Window from "../windows/r1s2Window";
import R1s3Window from "../windows/r1s3Window";

type SceneWindowsProps = {
	selectedGroup: string | null;
	roomId?: string;
	onClose: () => void;
};

export default function SceneWindows({ selectedGroup, onClose, roomId }: SceneWindowsProps)
{
	return (
		<>
			{selectedGroup === "mesh_node" && (
				<KewanWindow
					onClose={onClose}
				/>
			)}

			{selectedGroup === "user.r1s1" && (
				<R1s1Window
                    roomId={roomId}
					onClose={onClose}
				/>
			)}

			{selectedGroup === "user.r1s2" && (
				<R1s2Window
                    roomId={roomId}
					onClose={onClose}
				/>
			)}

			{selectedGroup === "user.r1s3" && (
				<R1s3Window
                    roomId={roomId}
					onClose={onClose}
				/>
			)}
		</>
	);
}
