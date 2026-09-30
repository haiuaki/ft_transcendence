"use client"

import ThreeScene from "../components/3D/ThreeScene";
import { Suspense, useRef, useState } from "react";
import { AuthModal } from "../components/AuthModal/AuthModal";
import { useAuth } from "../context/AuthContext";
import DynamicModalTemplate from "../components/TemplateModal/DynamicModalTemplate";
import { toast } from "sonner";

const Header = () => {
  const { isAuthenticated, user, logout, token, deleteProfile } = useAuth();
  const [openSignUp, setOpenSignUp] = useState<boolean>(false);
  const [openLogIn, setOpenLogIn] = useState<boolean>(false);
  const [openProfile, setOpenProfile] = useState<boolean>(false);

  const profileRef = useRef(null);
  return (
    <div className="select-none flex items-center fixed top-0 right-0 p-5 z-50 gap-2">
      {isAuthenticated && user?.username ?
        <div ref={profileRef} onClick={() => setOpenProfile(!openProfile)} className="font-semibold flex items-center py-2 px-3 text-black bg-white rounded-md">
          {user?.username}
        </div>
        : <>
          <div className="cursor-pointer font-semibold flex items-center py-2 px-3 text-black bg-white rounded-md hover:bg-white/80 active:bg-white" onClick={() => setOpenLogIn(true)}>
            <p>Log in</p>
          </div>
          <div className="cursor-pointer font-semibold flex items-center py-2 px-3 text-white bg-black rounded-md hover:bg-black/80 active:bg-black" onClick={() => setOpenSignUp(true)}>
            <p>Sign up</p>
          </div>
        </>
        }
      <AuthModal isOpen={openSignUp} onClose={() => setOpenSignUp(false)} view="sign_up" />
      <AuthModal isOpen={openLogIn} onClose={() => setOpenLogIn(false)} view="log_in" />
      {openProfile && <DynamicModalTemplate
          ref={profileRef}
          onClose={() => setOpenProfile(false)}
          placement="bottom-end"
          className=" rounded-lg border border-black/20 bg-white p-2 text-black"
        >
          <p className="text-sm font-semibold" onClick={() => {
            logout()
            setOpenProfile(false)
            }}>Logout</p>
          <p className="text-sm font-semibold" onClick={async () => {
            try {
              await deleteProfile(token || "");
              setOpenProfile(false);
              toast.success("Account deleted successfully.");
            } catch (e) {
              toast.error("Unable to delete account.", {
                description: e instanceof Error ? e.message : "An unexpected error occurred.",
              });
            }
            }}>delete</p>
        </DynamicModalTemplate>
}
    </div>
  )
}

function HomeContent() {
  return (
    <main className="flex w-full h-full overflow-hidden">
      <Header />
      <div className={"scene-page bg-black"}>
        <ThreeScene />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="w-full h-full bg-black"></div>}>
      <HomeContent />
    </Suspense>
  );
}
