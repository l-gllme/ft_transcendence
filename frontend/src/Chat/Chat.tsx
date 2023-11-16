import React from "react";
import DisplayAllUsers from "./DisplayAllUsers";
import DisplayAllRooms from "./DisplayAllRooms";
/* eslint-disable */
export default function Chat() {

  return (
    <div className="bg-gray-800 min-h-screen flex flex-col items-center mt-10">
      <div className="flex flex-col w-full items-center justify-center mt-2 space-y-6">  
        <DisplayAllUsers />
        <DisplayAllRooms />
      </div>
    </div>
  );
}

