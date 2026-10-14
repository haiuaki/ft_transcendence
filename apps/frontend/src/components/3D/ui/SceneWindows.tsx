import type { RoomMember } from "@/src/services/roomService";
import KewanWindow from "../windows/KewanWindow";
import R1s1Window from "../windows/r1s1Window";
import R1s2Window from "../windows/r1s2Window";
import R1s3Window from "../windows/r1s3Window";

type SceneWindowsProps = {
	selectedGroup: string | null;
	members: RoomMember[];
	loading: boolean;
	error: string;
	onClose: () => void;
};

export default function SceneWindows({ selectedGroup, onClose, members, loading, error }: SceneWindowsProps)
{
	return (
		<>
			<KewanWindow
				isOpen={selectedGroup === "mesh_node"}
				onClose={onClose}
			/>

			{selectedGroup === "user.r1s1" && (
				<R1s1Window
                    username={members[0]?.username} loading={loading} error={error}
					onClose={onClose}
				/>
			)}

			{selectedGroup === "user.r1s2" && (
				<R1s2Window
                    username={members[1]?.username} loading={loading} error={error}
					onClose={onClose}
				/>
			)}

			{selectedGroup === "user.r1s3" && (
				<R1s3Window
                    username={members[2]?.username} loading={loading} error={error}
					onClose={onClose}
				/>
			)}
		</>
	);
}
