import ThreeScene from "../components/3D/ThreeScene";
import { FaUser } from "react-icons/fa";

export default function Home() {

  return (
    <main className="scene-page">
      <div className="flex items-center justify-end fixed top-0 w-full p-5 z-50">
        <div className="flex items-center p-2 border border-1 border-white rounded-md">
          <FaUser size={20} color="white"/>
        </div>
      </div>
      <ThreeScene />
    </main>
  );
}
