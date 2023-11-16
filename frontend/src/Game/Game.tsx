import React, { useEffect } from "react";
import PongArena from "./PongArena";

export default function Game() {
    useEffect(() => {
        document.body.classList.add('overflow-hidden');
    
        return () => {
          document.body.classList.remove('overflow-hidden');
        };
      }, []);

    return (
        <div className="bg-gray-800 min-h-screen flex flex-col items-center mt-8 overflow-hidden">
			<PongArena />
        </div>
    );
}
